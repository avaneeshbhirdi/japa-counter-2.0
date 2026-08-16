import React, { useId } from 'react';

export type FeatherType = 'normal' | 'white' | 'gold';

interface FeatherIconProps {
  streak?: number;
  type?: FeatherType;
  size?: number;
}

export default function FeatherIcon({ streak = 0, type, size = 18 }: FeatherIconProps) {
  let resolvedType: FeatherType = 'normal';

  if (type) {
    resolvedType = type;
  } else {
    if (streak >= 30) resolvedType = 'gold';
    else if (streak >= 7) resolvedType = 'white';
  }

  const isWhite = resolvedType === 'white';
  const isGold = resolvedType === 'gold';

  // Color palettes per variant
  const palette = {
    normal: {
      stemBase: '#059669',
      stemTip: '#34d399',
      barb1: '#10b981',
      barb2: '#34d399',
      barb3: '#6ee7b7',
      eyeOuter: '#0ea5e9',
      eyeMid: '#38bdf8',
      eyeInner: '#0369a1',
      eyeCore: '#082f49',
      shimmer: '#a7f3d0',
      glow: 'rgba(16,185,129,0.35)',
    },
    white: {
      stemBase: '#94a3b8',
      stemTip: '#e2e8f0',
      barb1: '#cbd5e1',
      barb2: '#e2e8f0',
      barb3: '#f8fafc',
      eyeOuter: '#94a3b8',
      eyeMid: '#cbd5e1',
      eyeInner: '#64748b',
      eyeCore: '#1e293b',
      shimmer: '#f8fafc',
      glow: 'rgba(203,213,225,0.4)',
    },
    gold: {
      stemBase: '#b45309',
      stemTip: '#fcd34d',
      barb1: '#f59e0b',
      barb2: '#fbbf24',
      barb3: '#fde68a',
      eyeOuter: '#d97706',
      eyeMid: '#fbbf24',
      eyeInner: '#92400e',
      eyeCore: '#451a03',
      shimmer: '#fef9c3',
      glow: 'rgba(251,191,36,0.4)',
    },
  };

  const c = isWhite ? palette.white : isGold ? palette.gold : palette.normal;

  const uid = useId();
  // Unique gradient IDs per instance to avoid SVG defs conflicts and hydration mismatches
  const gid = `pk_${uid.replace(/:/g, '')}_${resolvedType}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0px 2px 6px ${c.glow})`, overflow: 'visible' }}
    >
      <defs>
        {/* Main feather body gradient */}
        <linearGradient id={`${gid}_body`} x1="50" y1="5" x2="50" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.barb3} />
          <stop offset="40%" stopColor={c.barb2} />
          <stop offset="100%" stopColor={c.barb1} />
        </linearGradient>
        {/* Stem gradient */}
        <linearGradient id={`${gid}_stem`} x1="50" y1="5" x2="50" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.stemTip} />
          <stop offset="100%" stopColor={c.stemBase} />
        </linearGradient>
        {/* Eye radial gradient */}
        <radialGradient id={`${gid}_eye`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={c.eyeCore} />
          <stop offset="35%" stopColor={c.eyeInner} />
          <stop offset="65%" stopColor={c.eyeMid} />
          <stop offset="100%" stopColor={c.eyeOuter} />
        </radialGradient>
        {/* Shimmer highlight */}
        <radialGradient id={`${gid}_shimmer`} cx="35%" cy="30%" r="40%">
          <stop offset="0%" stopColor={c.shimmer} stopOpacity="0.7" />
          <stop offset="100%" stopColor={c.shimmer} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Outer feather vanes (left) ── */}
      <path d="M50 18 C 42 25, 28 32, 18 48 C 25 42, 36 38, 50 38 Z" fill={`url(#${gid}_body)`} opacity="0.75" />
      <path d="M50 28 C 38 35, 22 46, 14 62 C 22 54, 35 50, 50 50 Z" fill={`url(#${gid}_body)`} opacity="0.75" />
      <path d="M50 40 C 36 48, 20 60, 16 78 C 24 68, 37 63, 50 63 Z" fill={`url(#${gid}_body)`} opacity="0.75" />
      <path d="M50 54 C 38 62, 26 74, 26 90 C 32 79, 42 73, 50 73 Z" fill={`url(#${gid}_body)`} opacity="0.7" />

      {/* ── Outer feather vanes (right) ── */}
      <path d="M50 18 C 58 25, 72 32, 82 48 C 75 42, 64 38, 50 38 Z" fill={`url(#${gid}_body)`} opacity="0.75" />
      <path d="M50 28 C 62 35, 78 46, 86 62 C 78 54, 65 50, 50 50 Z" fill={`url(#${gid}_body)`} opacity="0.75" />
      <path d="M50 40 C 64 48, 80 60, 84 78 C 76 68, 63 63, 50 63 Z" fill={`url(#${gid}_body)`} opacity="0.75" />
      <path d="M50 54 C 62 62, 74 74, 74 90 C 68 79, 58 73, 50 73 Z" fill={`url(#${gid}_body)`} opacity="0.7" />

      {/* ── Central feather body ── */}
      <path
        d="M50 5 C 34 18, 26 38, 28 62 C 32 80, 42 92, 50 105 C 58 92, 68 80, 72 62 C 74 38, 66 18, 50 5 Z"
        fill={`url(#${gid}_body)`}
        opacity="0.9"
      />

      {/* ── Eye (peacock feather eye) ── */}
      {/* Outer glow ring */}
      <ellipse cx="50" cy="38" rx="18" ry="22" fill={c.eyeOuter} opacity="0.35" />
      {/* Main eye */}
      <ellipse cx="50" cy="38" rx="14" ry="18" fill={`url(#${gid}_eye)`} />
      {/* Shimmer on eye */}
      <ellipse cx="50" cy="38" rx="14" ry="18" fill={`url(#${gid}_shimmer)`} />
      {/* Highlight dot */}
      <circle cx="44" cy="33" r="3" fill="white" opacity="0.45" />

      {/* ── Stem / rachis ── */}
      <path
        d="M50 5 Q 50 55 50 112"
        stroke={`url(#${gid}_stem)`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ── Fine barb lines (left) ── */}
      <path d="M50 22 Q 38 28 30 36" stroke={c.barb2} strokeWidth="0.8" opacity="0.5" fill="none" />
      <path d="M50 32 Q 36 40 26 50" stroke={c.barb2} strokeWidth="0.8" opacity="0.5" fill="none" />
      <path d="M50 44 Q 35 53 24 64" stroke={c.barb2} strokeWidth="0.8" opacity="0.5" fill="none" />
      <path d="M50 58 Q 37 67 29 78" stroke={c.barb2} strokeWidth="0.8" opacity="0.5" fill="none" />
      <path d="M50 72 Q 40 80 34 90" stroke={c.barb2} strokeWidth="0.8" opacity="0.45" fill="none" />

      {/* ── Fine barb lines (right) ── */}
      <path d="M50 22 Q 62 28 70 36" stroke={c.barb2} strokeWidth="0.8" opacity="0.5" fill="none" />
      <path d="M50 32 Q 64 40 74 50" stroke={c.barb2} strokeWidth="0.8" opacity="0.5" fill="none" />
      <path d="M50 44 Q 65 53 76 64" stroke={c.barb2} strokeWidth="0.8" opacity="0.5" fill="none" />
      <path d="M50 58 Q 63 67 71 78" stroke={c.barb2} strokeWidth="0.8" opacity="0.5" fill="none" />
      <path d="M50 72 Q 60 80 66 90" stroke={c.barb2} strokeWidth="0.8" opacity="0.45" fill="none" />
    </svg>
  );
}
