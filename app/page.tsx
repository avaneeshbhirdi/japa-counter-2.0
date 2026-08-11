'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

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
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [isDeletingLogs, setIsDeletingLogs] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const supabase = createClient();
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const counterCircleRef = useRef<HTMLDivElement>(null);
  const counterNumberRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTimerRef = useRef(timerSeconds);

  useEffect(() => { currentTimerRef.current = timerSeconds; }, [timerSeconds]);

  // ── Auth Listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
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

  useEffect(() => {
    if (user) void fetchLogs();
  }, [fetchLogs, user]);

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
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

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

      const numEl = counterNumberRef.current;
      if (numEl) {
        numEl.classList.add('count-popping');
        setTimeout(() => numEl.classList.remove('count-popping'), 200);
      }

      if (next === MAX_COUNT) completeRound();
    }
  }, [timerSeconds, isTimerRunning, startTimer, isRoundComplete, currentCount, completeRound, initAudio]);

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
      const { error } = await supabase.auth.updateUser({ data: { full_name: editName, avatar_url: avatarUrl } });
      if (error) throw error;
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
    background: `
      conic-gradient(
        rgba(80, 120, 240, 0.45) ${degrees}deg,
        rgba(18, 26, 68, 0.7) ${degrees}deg
      ),
      radial-gradient(circle at 45% 35%, rgba(28, 38, 90, 0.5), rgba(10, 14, 40, 0.85))
    `,
    opacity: (!isTimerRunning && !(totalCount === 0 && timerSeconds === 0)) ? 0.55 : 1,
    cursor: (!isTimerRunning && !(totalCount === 0 && timerSeconds === 0)) ? 'not-allowed' : 'pointer',
  };

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
          {user && (
            <button
              className="nav-btn primary"
              onClick={() => setIsLogOpen(prev => !prev)}
            >
              {isLogOpen ? 'Close Log' : 'Sadhana Log'}
            </button>
          )}
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
                      </div>
                      <button
                        className="edit-btn"
                        title="Edit profile"
                        onClick={() => { setEditName(displayName); setIsEditingProfile(true); }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                    </div>

                    <div style={{ marginBottom: '0.25rem' }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(160,175,210,0.6)', fontWeight: 600, marginBottom: '0.4rem' }}>Lifetime Stats</div>
                      <div className="stat-row">
                        <span className="stat-label">Total Rounds</span>
                        <span className="stat-value-rounds">{lifetimeRounds}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Total Count</span>
                        <span className="stat-value-counts">{lifetimeCounts}</span>
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
          <div className="log-table-card">
            <h2 className="log-title">My Sadhana History</h2>
            {logs.length === 0 ? (
              <div className="log-empty">No sadhana logs yet. Start chanting and your sessions will be saved here.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="log-table">
                  <thead>
                    <tr>
                      <th style={{ width: '2.5rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          aria-label="Select all"
                          checked={selectedLogs.length === logs.length && logs.length > 0}
                          onChange={e => e.target.checked ? setSelectedLogs(logs.map(l => l.id)) : setSelectedLogs([])}
                        />
                      </th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Total Counts</th>
                      <th>Session</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      let dateStr = log.date;
                      let timeStr = log.time;
                      try {
                        const d = log.created_at ? new Date(log.created_at) : new Date(`${log.date}T${log.time}`);
                        if (!isNaN(d.getTime())) {
                          dateStr = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(d);
                          timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
                        }
                      } catch { /* fallback */ }

                      const reqCounts = log.counts || 0;
                      const sRounds = Math.floor(reqCounts / 108);
                      const sCounts = reqCounts % 108;
                      const breakdown = sRounds > 0 && sCounts > 0 ? `${sRounds} R, ${sCounts} C` : sRounds > 0 ? `${sRounds} R` : `${sCounts} C`;

                      let duration = '-';
                      if (log.duration_seconds != null) {
                        const m = Math.floor(log.duration_seconds / 60);
                        const s = log.duration_seconds % 60;
                        duration = m > 0 ? `${m}m ${s}s` : `${s}s`;
                      }

                      return (
                        <tr key={log.id} className={selectedLogs.includes(log.id) ? 'selected' : ''}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              aria-label="Select log"
                              checked={selectedLogs.includes(log.id)}
                              onChange={() => toggleLogSelection(log.id)}
                            />
                          </td>
                          <td className="td-date">{dateStr}</td>
                          <td className="td-time">{timeStr}</td>
                          <td className="td-counts">{reqCounts}</td>
                          <td className="td-breakdown">{breakdown}</td>
                          <td className="td-duration">{duration}</td>
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
            onClick={incrementCount}
            onPointerDown={e => {
              if (e.pointerType === 'touch') {
                e.preventDefault();
                incrementCount();
              }
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
    </>
  );
}
