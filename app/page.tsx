'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import FeatherIcon from './components/FeatherIcon';

const MAX_COUNT = 108;

interface SadhanaLog {
  id: string;
  user_id: string;
  date: string;
  time: string;
  counts: number;
  rounds: number;
  duration_seconds?: number;
  created_at?: string;
}

interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url: string;
  city: string;
  current_streak?: number;
  total_rounds: number;
  total_counts: number;
}

export default function Home() {
  // ── Counter State ────────────────────────────────────────────────────────
  const [currentCount, setCurrentCount] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [showRoundFlash, setShowRoundFlash] = useState(false);

  // ── Timer State ──────────────────────────────────────────────────────────
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // ── Auth & Data ──────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<SadhanaLog[]>([]);
  const [lifetimeCounts, setLifetimeCounts] = useState(0);
  const [lifetimeRounds, setLifetimeRounds] = useState(0);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);

  // ── UI State ─────────────────────────────────────────────────────────────
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [isDeletingLogs, setIsDeletingLogs] = useState(false);
  
  // ── Leaderboard State ────────────────────────────────────────────────────
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'city'>('global');
  const [userCity, setUserCity] = useState('');
  const [isLeaderboardRefreshing, setIsLeaderboardRefreshing] = useState(false);

  // ── Calendar State ───────────────────────────────────────────────────────
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // ── Settings ─────────────────────────────────────────────────────────────
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const supabase = createClient();
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const counterCircleRef = useRef<HTMLDivElement>(null);
  const counterNumberRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTimerRef = useRef(timerSeconds);

  useEffect(() => { currentTimerRef.current = timerSeconds; }, [timerSeconds]);

  // Load local settings
  useEffect(() => {
    const savedVibe = localStorage.getItem('japa_vibration');
    if (savedVibe !== null) setIsVibrationEnabled(savedVibe === 'true');
  }, []);

  // ── Auth Listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch user's profile to get their city
        const { data } = await supabase.from('profiles').select('city').eq('id', user.id).single();
        if (data?.city) setUserCity(data.city);
      }
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch Logs ───────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('sadhana_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLogs(data as SadhanaLog[]);
      const total = data.reduce((acc, l) => acc + (l.counts || 0), 0);
      setLifetimeCounts(total);
      setLifetimeRounds(Math.floor(total / 108));
      setSelectedLogs(prev => prev.filter(id => data.some(l => l.id === id)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Fetch Leaderboard ────────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setIsLeaderboardRefreshing(true);
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('current_streak', { ascending: false, nullsFirst: false })
      .order('total_rounds', { ascending: false })
      .order('total_counts', { ascending: false })
      .limit(100);
    
    if (leaderboardTab === 'city' && userCity) {
      query = query.ilike('city', userCity);
    }
    
    const { data, error } = await query;
    if (!error && data) {
      setLeaderboardData(data as LeaderboardEntry[]);
    }
    setIsLeaderboardRefreshing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardTab, userCity]);

  useEffect(() => {
    if (isLeaderboardOpen) void fetchLeaderboard();
  }, [isLeaderboardOpen, leaderboardTab, fetchLeaderboard]);

  useEffect(() => {
    if (user) void fetchLogs();
  }, [fetchLogs, user]);

  // ── Calendar Helpers ─────────────────────────────────────────────────────
  const currentYear = currentCalendarMonth.getFullYear();
  const currentMonthNum = currentCalendarMonth.getMonth();
  const daysInMonth = new Date(currentYear, currentMonthNum + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonthNum, 1).getDay();

  const logsByDay = useMemo(() => {
    const map = new Map<string, { rounds: number; counts: number; logs: SadhanaLog[] }>();
    logs.forEach(log => {
      let dateKey = log.date;
      try {
        const d = log.created_at ? new Date(log.created_at) : new Date(`${log.date}T${log.time}`);
        if (!isNaN(d.getTime())) {
          dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      } catch {}
      
      if (!map.has(dateKey)) {
        map.set(dateKey, { rounds: 0, counts: 0, logs: [] });
      }
      const entry = map.get(dateKey)!;
      entry.rounds += log.rounds || 0;
      entry.counts += log.counts || 0;
      entry.logs.push(log);
    });
    return map;
  }, [logs]);

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonthNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateKey, stats: logsByDay.get(dateKey) || null });
    }
    return cells;
  }, [firstDay, daysInMonth, currentYear, currentMonthNum, logsByDay]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const now = new Date();
    const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (!logsByDay.has(formatDate(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!logsByDay.has(formatDate(checkDate))) return 0; 
    }

    while (logsByDay.has(formatDate(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }, [logsByDay]);

  const prevMonth = () => setCurrentCalendarMonth(new Date(currentYear, currentMonthNum - 1, 1));
  const nextMonth = () => setCurrentCalendarMonth(new Date(currentYear, currentMonthNum + 1, 1));
  
  const todayDateKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  // ── Audio ────────────────────────────────────────────────────────────────
  const initAudio = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) audioContextRef.current = new AC();
    }
  }, []);

  const playBell = useCallback(() => {
    initAudio();
    const ac = audioContextRef.current;
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(132, ac.currentTime + 2);
    gain.gain.setValueAtTime(0.35, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2);
    osc.start();
    osc.stop(ac.currentTime + 2);
  }, [initAudio]);

  const vibrateDevice = useCallback(() => {
    if (isVibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [isVibrationEnabled]);

  const vibrateTap = useCallback(() => {
    if (isVibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30); // Very short tap vibration
    }
  }, [isVibrationEnabled]);

  // ── Timer ────────────────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startTimer = useCallback(() => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
  }, [isTimerRunning]);

  const pauseTimer = useCallback(() => {
    if (isTimerRunning) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsTimerRunning(false);
    }
  }, [isTimerRunning]);

  const resetTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsTimerRunning(false);
    setTimerSeconds(0);
  }, []);

  const toggleTimer = useCallback(() => {
    if (isTimerRunning) pauseTimer();
    else startTimer();
  }, [isTimerRunning, pauseTimer, startTimer]);

  // ── Save to Supabase ─────────────────────────────────────────────────────
  const saveToLog = useCallback(async () => {
    if (!user) return;
    if (totalCount === 0 && roundsCompleted === 0) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    if (currentLogId) {
      await supabase.from('sadhana_logs').update({
        counts: totalCount,
        rounds: roundsCompleted,
        duration_seconds: currentTimerRef.current,
      }).eq('id', currentLogId);
    } else {
      const { data } = await supabase.from('sadhana_logs').insert([{
        user_id: user.id,
        date: dateStr,
        time: timeStr,
        counts: totalCount,
        rounds: roundsCompleted,
        duration_seconds: currentTimerRef.current,
      }]).select();
      if (data?.[0]) setCurrentLogId(data[0].id);
    }
    await fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, totalCount, roundsCompleted, currentLogId]);

  // Auto-save with 2s debounce
  useEffect(() => {
    if (totalCount === 0 && roundsCompleted === 0) return;
    const t = setTimeout(() => void saveToLog(), 2000);
    return () => clearTimeout(t);
  }, [totalCount, roundsCompleted, saveToLog]);

  // ── Counter Logic ────────────────────────────────────────────────────────
  const completeRound = useCallback(() => {
    setRoundsCompleted(prev => prev + 1);
    setIsRoundComplete(true);
    playBell();
    vibrateDevice();

    setShowRoundFlash(true);
    setTimeout(() => setShowRoundFlash(false), 2500);
  }, [playBell, vibrateDevice]);

  const incrementCount = useCallback(() => {
    const isFresh = timerSeconds === 0 && !isTimerRunning;

    if (isFresh) {
      startTimer();
    } else if (!isTimerRunning) {
      // Shake animation when timer is paused
      const el = counterCircleRef.current;
      if (el) {
        el.classList.add('shaking');
        setTimeout(() => el.classList.remove('shaking'), 350);
      }
      return;
    }

    initAudio();

    if (isRoundComplete) {
      setCurrentCount(1);
      setTotalCount(prev => prev + 1);
      setIsRoundComplete(false);
      return;
    }

    if (currentCount < MAX_COUNT) {
      const next = currentCount + 1;
      setCurrentCount(next);
      setTotalCount(prev => prev + 1);

      vibrateTap();

      const numEl = counterNumberRef.current;
      if (numEl) {
        numEl.classList.add('count-popping');
        setTimeout(() => numEl.classList.remove('count-popping'), 200);
      }

      if (next === MAX_COUNT) completeRound();
    }
  }, [timerSeconds, isTimerRunning, startTimer, isRoundComplete, currentCount, completeRound, initAudio, vibrateTap]);

  const handleReset = useCallback(() => {
    if (confirm('Reset session progress? This will reset the count, rounds, and timer to 0.')) {
      setCurrentCount(0);
      setTotalCount(0);
      setRoundsCompleted(0);
      setIsRoundComplete(false);
      setCurrentLogId(null); // Start a new log entry after reset
      resetTimer();
    }
  }, [resetTimer]);

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); incrementCount(); }
      if (e.code === 'Escape') { e.preventDefault(); e.shiftKey ? handleReset() : toggleTimer(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [incrementCount, handleReset, toggleTimer]);

  // ── Profile Management ───────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      let avatarUrl = user.user_metadata?.avatar_url;
      if (editAvatarFile) {
        const ext = editAvatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${ext}`;
        const { data: upData, error: upErr } = await supabase.storage
          .from('avatars').upload(fileName, editAvatarFile, { upsert: true });
        if (upErr) throw upErr;
        if (upData) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }
      
      // Update Auth metadata
      const { error } = await supabase.auth.updateUser({ data: { full_name: editName, avatar_url: avatarUrl } });
      if (error) throw error;
      
      // Update Profiles table (for leaderboard)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: editName,
        avatar_url: avatarUrl,
        city: editCity.trim() || null
      });
      if (profileError) throw profileError;
      
      setUserCity(editCity.trim());
      setIsEditingProfile(false);
    } catch (e) {
      console.error(e);
      alert('Error saving profile.');
    } finally {
      setIsSavingProfile(false);
      setEditAvatarFile(null);
      setEditAvatarPreview(null);
    }
  };

  const handleDeleteLogs = async () => {
    if (selectedLogs.length === 0) return;
    if (!confirm('Delete selected logs? This will permanently remove them and update your lifetime stats.')) return;
    setIsDeletingLogs(true);
    try {
      const { error } = await supabase.from('sadhana_logs').delete().in('id', selectedLogs);
      if (error) throw error;
      setSelectedLogs([]);
      await fetchLogs();
    } catch (e) {
      console.error(e);
      alert('Error deleting logs.');
    } finally {
      setIsDeletingLogs(false);
    }
  };

  const toggleLogSelection = (id: string) => {
    setSelectedLogs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Progress Ring (conic gradient) ───────────────────────────────────────
  const progress = currentCount / MAX_COUNT;
  const degrees = progress * 360;
  const circleStyle: React.CSSProperties = {
    '--progress-deg': `${degrees}deg`,
    opacity: (!isTimerRunning && !(totalCount === 0 && timerSeconds === 0)) ? 0.55 : 1,
    cursor: (!isTimerRunning && !(totalCount === 0 && timerSeconds === 0)) ? 'not-allowed' : 'pointer',
  } as React.CSSProperties;

  // ── Avatar helpers ───────────────────────────────────────────────────────
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = user?.email?.charAt(0).toUpperCase() ?? 'U';
  const displayName = user?.user_metadata?.full_name || 'Devotee';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Cosmic Background ── */}
      <div className="cosmic-background">
        <div className="stars"></div>
        <div className="nebula"></div>
      </div>

      {/* ── Round Complete Flash Overlay ── */}
      <div className={`round-flash ${showRoundFlash ? 'show' : ''}`}>
        <div className="round-flash-text">
          🙏 Hare Krishna!<br />
          Round {roundsCompleted} Complete
        </div>
      </div>

      {/* ── Nav Bar ── */}
      <nav className="nav-bar">
        <div className="nav-left">
          <div className="nav-logo">
            <img src="/logo.png" alt="JapaCounter Logo" className="logo-img" />
            <span className="logo-text">JAPACOUNTER</span>
          </div>
        </div>

        <div className="nav-right">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                className="profile-btn"
                onClick={() => setIsProfileOpen(p => !p)}
                aria-label="Open profile"
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" />
                  : initials
                }
              </button>

              {/* Profile Dropdown */}
              <div className={`profile-dropdown ${isProfileOpen ? 'visible' : 'hidden'}`}>
                {isEditingProfile ? (
                  <>
                    <div
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.875rem' }}
                    >
                      <div
                        style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {editAvatarPreview
                          ? <img src={editAvatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : avatarUrl
                            ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#4a3fa0,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>{initials}</div>
                        }
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1024 * 1024) { alert('Photo must be < 1 MB.'); return; }
                          setEditAvatarFile(file);
                          const reader = new FileReader();
                          reader.onload = re => setEditAvatarPreview(re.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </div>
                    <div className="edit-field" style={{ marginBottom: '0.5rem' }}>
                      <label>Full Name</label>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your Name" />
                    </div>
                    <div className="edit-field" style={{ marginBottom: '0.75rem' }}>
                      <label>City</label>
                      <input type="text" value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="E.g. Mumbai, New York" />
                    </div>
                    <div className="edit-actions">
                      <button className="btn-cancel" disabled={isSavingProfile} onClick={() => { setIsEditingProfile(false); setEditAvatarFile(null); setEditAvatarPreview(null); }}>Cancel</button>
                      <button className="btn-save" disabled={isSavingProfile} onClick={handleSaveProfile}>{isSavingProfile ? 'Saving…' : 'Save'}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="profile-user-row">
                      <div className="profile-avatar-sm">
                        {avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : initials}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="profile-name">{displayName}</div>
                        <div className="profile-email">{user.email}</div>
                        {userCity && <div className="profile-city" style={{ fontSize: '0.7rem', color: '#c89b3c', marginTop: '2px' }}>📍 {userCity}</div>}
                      </div>
                      <button
                        className="edit-btn"
                        title="Edit profile"
                        onClick={() => { setEditName(displayName); setEditCity(userCity); setIsEditingProfile(true); }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                    </div>

                    <div style={{ marginBottom: '0.25rem' }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(160,175,210,0.6)', fontWeight: 600, marginBottom: '0.4rem' }}>Lifetime Stats</div>
                      <div className="stat-row">
                        <span className="stat-label">Current Streak</span>
                        <span className={`streak-badge streak-badge-${currentStreak >= 30 ? 'gold' : currentStreak >= 7 ? 'white' : 'normal'}`} style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', marginTop: 0 }}>
                          <FeatherIcon streak={currentStreak} size={14} /> {currentStreak}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Total Rounds</span>
                        <span className="stat-value-rounds">{lifetimeRounds}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Total Count</span>
                        <span className="stat-value-counts">{lifetimeCounts}</span>
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Haptic Vibration</span>
                        <button 
                          style={{
                            background: isVibrationEnabled ? '#c89b3c' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '20px',
                            width: '40px',
                            height: '22px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => {
                            const next = !isVibrationEnabled;
                            setIsVibrationEnabled(next);
                            localStorage.setItem('japa_vibration', String(next));
                            if (next && navigator.vibrate) navigator.vibrate(30);
                          }}
                        >
                          <div style={{
                            width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                            position: 'absolute', top: '2px', left: isVibrationEnabled ? '20px' : '2px',
                            transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </button>
                      </div>
                    </div>

                    <button
                      className="signout-btn"
                      onClick={() => { setIsProfileOpen(false); supabase.auth.signOut(); }}
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <a href="/login" className="nav-btn">Log In</a>
              <a href="/login" className="nav-btn primary">Sign Up</a>
            </>
          )}
        </div>
      </nav>

      {/* ── Sadhana Log Panel ── */}
      {user && (
        <div className={`log-panel ${isLogOpen ? 'log-visible' : 'log-hidden'}`}>
          {/* Stats Bar */}
          <div className="log-stats-bar">
            <div className="log-stat-item">
              <span className="log-stat-label">Lifetime Counts</span>
              <span className="log-stat-value purple">{lifetimeCounts}</span>
            </div>
            <div className="log-divider-v" />
            <div className="log-stat-item">
              <span className="log-stat-label">Lifetime Rounds</span>
              <span className="log-stat-value emerald">{lifetimeRounds}</span>
            </div>
            <div className="log-divider-v" />
            <button
              className={`log-delete-btn ${selectedLogs.length > 0 ? 'active' : ''}`}
              onClick={handleDeleteLogs}
              disabled={isDeletingLogs || selectedLogs.length === 0}
              title={selectedLogs.length === 0 ? 'Select logs to delete' : 'Delete selected'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
              Delete {selectedLogs.length > 0 && `(${selectedLogs.length})`}
            </button>
          </div>

          {/* Table */}
          {/* Table / Calendar */}
          <div className="log-table-card">
            {!selectedDay ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 className="log-title" style={{ margin: 0 }}>Sadhana Calendar</h2>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="streak-badge streak-badge-normal" style={{ marginTop: 0 }} title="Daily Streak: Chanting every day">
                        <FeatherIcon type="normal" size={16} /> {currentStreak}
                      </span>
                      <span className="streak-badge streak-badge-white" style={{ marginTop: 0 }} title="Weekly Streak: 7 continuous days of chanting">
                        <FeatherIcon type="white" size={16} /> {Math.floor(currentStreak / 7)}
                      </span>
                      <span className="streak-badge streak-badge-gold" style={{ marginTop: 0 }} title="Monthly Streak: 30 continuous days of chanting">
                        <FeatherIcon type="gold" size={16} /> {Math.floor(currentStreak / 30)}
                      </span>
                    </div>
                  </div>
                  <div className="calendar-nav">
                    <button onClick={prevMonth} className="calendar-nav-btn">&larr;</button>
                    <span className="calendar-month-label">
                      {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalendarMonth)}
                    </span>
                    <button onClick={nextMonth} className="calendar-nav-btn">&rarr;</button>
                  </div>
                </div>

                <div className="calendar-grid">
                  <div className="calendar-weekday">Sun</div>
                  <div className="calendar-weekday">Mon</div>
                  <div className="calendar-weekday">Tue</div>
                  <div className="calendar-weekday">Wed</div>
                  <div className="calendar-weekday">Thu</div>
                  <div className="calendar-weekday">Fri</div>
                  <div className="calendar-weekday">Sat</div>
                  
                  {calendarCells.map((cell: any, idx: number) => {
                    if (!cell) return <div key={`empty-${idx}`} className="calendar-cell empty" />;
                    const hasStats = !!cell.stats;
                    const isToday = cell.dateKey === todayDateKey;
                    
                    return (
                      <div 
                        key={cell.dateKey} 
                        className={`calendar-cell ${hasStats ? 'has-data' : ''} ${isToday ? 'today' : ''}`}
                        onClick={() => hasStats ? setSelectedDay(cell.dateKey) : null}
                      >
                        <span className="calendar-day-num">{cell.day}</span>
                        {hasStats && (
                          <div className="calendar-stats">
                            <span className="calendar-rounds">{cell.stats.rounds}R</span>
                            <span className="calendar-counts">{cell.stats.counts}C</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 className="log-title" style={{ margin: 0 }}>
                    {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(selectedDay))}
                  </h2>
                  <button className="nav-btn primary" onClick={() => setSelectedDay(null)} style={{ padding: '0.3rem 0.8rem' }}>
                    &larr; Back
                  </button>
                </div>
                <div className="mobile-hint">Long-press a row to select it for deletion</div>
                
                {logsByDay.get(selectedDay)?.logs.length === 0 ? (
                  <div className="log-empty">No sadhana logs for this day.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="log-table">
                      <thead>
                        <tr>
                          <th className="td-checkbox" style={{ width: '3rem', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              aria-label="Select all"
                              checked={
                                (logsByDay.get(selectedDay)?.logs || []).length > 0 &&
                                (logsByDay.get(selectedDay)?.logs || []).every((l: any) => selectedLogs.includes(l.id))
                              }
                              onChange={e => {
                                const dayLogs = logsByDay.get(selectedDay)?.logs || [];
                                if (e.target.checked) {
                                  const newSet = new Set(selectedLogs);
                                  dayLogs.forEach((l: any) => newSet.add(l.id));
                                  setSelectedLogs(Array.from(newSet));
                                } else {
                                  const dayLogIds = dayLogs.map((l: any) => l.id);
                                  setSelectedLogs(selectedLogs.filter(id => !dayLogIds.includes(id)));
                                }
                              }}
                            />
                          </th>
                          <th>Time</th>
                          <th>Total Counts</th>
                          <th>Total Rounds</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(logsByDay.get(selectedDay)?.logs || []).map((log: any) => {
                          let timeStr = log.time;
                          try {
                            const d = log.created_at ? new Date(log.created_at) : new Date(`${log.date}T${log.time}`);
                            if (!isNaN(d.getTime())) {
                              timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
                            }
                          } catch { /* fallback */ }

                          const reqCounts = log.counts || 0;
                          const reqRounds = log.rounds || 0;

                          let duration = '-';
                          if (log.duration_seconds != null) {
                            const m = Math.floor(log.duration_seconds / 60);
                            const s = log.duration_seconds % 60;
                            duration = m > 0 ? `${m}m ${s}s` : `${s}s`;
                          }

                          let pressTimer: ReturnType<typeof setTimeout>;

                          return (
                            <tr 
                              key={log.id} 
                              className={selectedLogs.includes(log.id) ? 'selected' : ''}
                              onTouchStart={() => {
                                pressTimer = setTimeout(() => {
                                  toggleLogSelection(log.id);
                                  if (isVibrationEnabled && navigator.vibrate) navigator.vibrate(50);
                                }, 500);
                              }}
                              onTouchEnd={() => clearTimeout(pressTimer)}
                              onTouchMove={() => clearTimeout(pressTimer)}
                              onContextMenu={(e) => {
                                if (window.innerWidth <= 640) e.preventDefault();
                              }}
                            >
                              <td className="td-checkbox" style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  aria-label="Select log"
                                  checked={selectedLogs.includes(log.id)}
                                  onChange={() => toggleLogSelection(log.id)}
                                />
                              </td>
                              <td className="td-time">{timeStr}</td>
                              <td className="td-counts">{reqCounts}</td>
                              <td className="td-breakdown">{reqRounds}</td>
                              <td className="td-duration">{duration}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Leaderboard Panel ── */}
      {user && (
        <div className={`log-panel ${isLeaderboardOpen ? 'log-visible' : 'log-hidden'}`}>
          <div className="log-stats-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`leaderboard-tab ${leaderboardTab === 'global' ? 'active' : ''}`}
                onClick={() => setLeaderboardTab('global')}
              >
                Global
              </button>
              <button 
                className={`leaderboard-tab ${leaderboardTab === 'city' ? 'active' : ''}`}
                onClick={() => setLeaderboardTab('city')}
                disabled={!userCity}
                title={!userCity ? 'Set your city in profile first' : ''}
              >
                My City {userCity && `(${userCity})`}
              </button>
            </div>
            <button 
              className="log-delete-btn" 
              onClick={fetchLeaderboard}
              disabled={isLeaderboardRefreshing}
              title="Refresh"
            >
              <svg 
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={isLeaderboardRefreshing ? 'spin' : ''}
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
              </svg>
            </button>
          </div>

          <div className="log-table-card">
            <h2 className="log-title">Leaderboard {leaderboardTab === 'city' && userCity ? `- ${userCity}` : ''}</h2>
            {leaderboardData.length === 0 ? (
              <div className="log-empty">No devotees found on the leaderboard yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="log-table leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: '4rem', textAlign: 'center' }}>Rank</th>
                      <th>Devotee</th>
                      <th>Total Rounds</th>
                      <th>Total Counts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, index) => {
                      const rank = index + 1;
                      let rankDisplay: React.ReactNode = <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>#{rank}</span>;
                      if (rank === 1) rankDisplay = <span className="medal gold" title="1st Place">🥇</span>;
                      if (rank === 2) rankDisplay = <span className="medal silver" title="2nd Place">🥈</span>;
                      if (rank === 3) rankDisplay = <span className="medal bronze" title="3rd Place">🥉</span>;

                      const isMe = entry.id === user.id;

                      return (
                        <tr key={entry.id} className={isMe ? 'leaderboard-me' : ''}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{rankDisplay}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="profile-avatar-sm" style={{ width: '2rem', height: '2rem', fontSize: '0.9rem' }}>
                                {entry.avatar_url ? <img src={entry.avatar_url} alt="Avatar" /> : (entry.full_name?.charAt(0).toUpperCase() || 'U')}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: isMe ? 600 : 400, color: '#fff' }}>{entry.full_name || 'Anonymous Devotee'}</span>
                                  {(entry.current_streak && entry.current_streak > 0) ? (
                                    <span className={`streak-badge streak-badge-${entry.current_streak >= 30 ? 'gold' : entry.current_streak >= 7 ? 'white' : 'normal'}`} style={{ marginTop: 0, padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                                      <FeatherIcon streak={entry.current_streak} size={12} /> {entry.current_streak}
                                    </span>
                                  ) : null}
                                </div>
                                {leaderboardTab === 'global' && entry.city && (
                                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{entry.city}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="td-counts" style={{ color: '#c89b3c' }}>{entry.total_rounds}</td>
                          <td className="td-duration">{entry.total_counts}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="page-container">
        {/* Mantra Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', width: '100%', alignItems: 'center' }}>
          {/* Invocation — hidden on mobile via CSS */}
          <div className="mantra-panel invocation-panel">
            <div className="invocation-text">
              Jaya Sri-Krishna-Chaitanya Prabhu Nityananda<br />
              Sri-Adwaita Gadadhara Srivasadi-Gaura-Bhakta-Vrinda
            </div>
          </div>

          <div className="mantra-panel">
            <div className="maha-mantra-text">
              Hare Krishna, Hare Krishna,<br />
              Krishna Krishna, Hare Hare<br />
              Hare Rama, Hare Rama,<br />
              Rama Rama, Hare Rama
            </div>
          </div>
        </div>

        {/* Dashboard Bar */}
        <div className="dashboard-bar">
          {/* Timer */}
          <div className="db-timer-section">
            <div className="db-timer-value">{formatTime(timerSeconds)}</div>
            <button className="db-play-btn" onClick={toggleTimer} aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}>
              {isTimerRunning ? '⏸' : '▶'}
            </button>
          </div>

          {/* Total */}
          <div className="db-stat">
            <div className="db-stat-label">Total</div>
            <div className="db-stat-value">{totalCount}</div>
          </div>

          {/* Rounds */}
          <div className="db-stat">
            <div className="db-stat-label">Rounds</div>
            <div className="db-stat-value">{roundsCompleted}</div>
          </div>

          <div className="db-separator" />

          {/* Reset */}
          <button className="db-reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>

        {/* Counter Circle */}
        <div className="counter-container">
          <div
            className="counter-circle"
            ref={counterCircleRef}
            style={circleStyle}
            onPointerDown={e => {
              // Handle both mouse and touch, prevent double-firing
              e.preventDefault();
              incrementCount();
            }}
            role="button"
            aria-label={`Count: ${currentCount}. Click or press Space to increment.`}
            tabIndex={0}
          >
            <div className="counter-number" ref={counterNumberRef}>{currentCount}</div>
            <div className="counter-hint">
              {typeof window !== 'undefined' && 'ontouchstart' in window ? 'Tap to Chant' : 'Press Space'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fixed buttons */}
      {user && (
        <>
          <div className="bottom-left-btn">
            <button
              className="nav-btn primary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}
              onClick={() => { setIsLogOpen(prev => !prev); setIsLeaderboardOpen(false); }}
            >
              {isLogOpen ? 'Close Log' : 'Sadhana Log'}
            </button>
          </div>
          <div className="bottom-right-btn">
            <button
              className="nav-btn primary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}
              onClick={() => { setIsLeaderboardOpen(prev => !prev); setIsLogOpen(false); }}
            >
              {isLeaderboardOpen ? 'Close Leaderboard' : 'Leaderboard'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
