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

  const palette = {
    normal: {
      stemBase: '#059669', barb1: '#10b981', barb2: '#34d399', barb3: '#6ee7b7',
      eyeOuter: '#0ea5e9', eyeMid: '#38bdf8', eyeInner: '#0369a1', eyeCore: '#082f49',
      glow: 'rgba(16,185,129,0.35)',
    },
    white: {
      stemBase: '#94a3b8', barb1: '#cbd5e1', barb2: '#e2e8f0', barb3: '#f8fafc',
      eyeOuter: '#94a3b8', eyeMid: '#cbd5e1', eyeInner: '#64748b', eyeCore: '#1e293b',
      glow: 'rgba(203,213,225,0.4)',
    },
    gold: {
      stemBase: '#b45309', barb1: '#f59e0b', barb2: '#fbbf24', barb3: '#fde68a',
      eyeOuter: '#d97706', eyeMid: '#fbbf24', eyeInner: '#92400e', eyeCore: '#451a03',
      glow: 'rgba(251,191,36,0.4)',
    },
  };

  const c = isWhite ? palette.white : isGold ? palette.gold : palette.normal;
  const uid = useId();
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
        <linearGradient id={`${gid}_body`} x1="50" y1="0" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.barb3} />
          <stop offset="50%" stopColor={c.barb2} />
          <stop offset="100%" stopColor={c.barb1} />
        </linearGradient>
        <linearGradient id={`${gid}_stem`} x1="50" y1="40" x2="50" y2="118" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.barb2} />
          <stop offset="100%" stopColor={c.stemBase} />
        </linearGradient>
      </defs>

      {/* Fan vanes — left */}
      <path d="M50 42 C 44 32, 30 20, 12 16 C 18 22, 30 30, 42 42 Z" fill={`url(#${gid}_body)`} opacity="0.9"/>
      <path d="M50 42 C 40 28, 24 12, 6 8 C 14 16, 28 26, 44 40 Z" fill={`url(#${gid}_body)`} opacity="0.8"/>
      <path d="M50 42 C 42 26, 32 8, 20 0 C 26 10, 34 22, 46 38 Z" fill={`url(#${gid}_body)`} opacity="0.8"/>

      {/* Fan vanes — right */}
      <path d="M50 42 C 56 32, 70 20, 88 16 C 82 22, 70 30, 58 42 Z" fill={`url(#${gid}_body)`} opacity="0.9"/>
      <path d="M50 42 C 60 28, 76 12, 94 8 C 86 16, 72 26, 56 40 Z" fill={`url(#${gid}_body)`} opacity="0.8"/>
      <path d="M50 42 C 58 26, 68 8, 80 0 C 74 10, 66 22, 54 38 Z" fill={`url(#${gid}_body)`} opacity="0.8"/>

      {/* Central top vane */}
      <path d="M50 42 C 48 28, 46 12, 46 2 C 48 8, 52 8, 54 2 C 54 12, 52 28, 50 42 Z" fill={`url(#${gid}_body)`} opacity="0.95"/>

      {/* Teardrop body below eye */}
      <path
        d="M50 42 C 38 52, 34 68, 38 84 C 41 96, 50 108, 50 118 C 50 108, 59 96, 62 84 C 66 68, 62 52, 50 42 Z"
        fill={`url(#${gid}_body)`}
        opacity="0.9"
      />

      {/* Vane edge barb lines — left */}
      <path d="M50 42 C 44 32, 30 20, 12 16" stroke={c.barb3} strokeWidth="0.8" opacity="0.6" fill="none"/>
      <path d="M50 42 C 40 28, 24 12, 6 8"  stroke={c.barb3} strokeWidth="0.8" opacity="0.5" fill="none"/>
      <path d="M50 42 C 42 26, 32 8, 20 0"  stroke={c.barb3} strokeWidth="0.8" opacity="0.5" fill="none"/>

      {/* Vane edge barb lines — right */}
      <path d="M50 42 C 56 32, 70 20, 88 16" stroke={c.barb3} strokeWidth="0.8" opacity="0.6" fill="none"/>
      <path d="M50 42 C 60 28, 76 12, 94 8"  stroke={c.barb3} strokeWidth="0.8" opacity="0.5" fill="none"/>
      <path d="M50 42 C 58 26, 68 8, 80 0"   stroke={c.barb3} strokeWidth="0.8" opacity="0.5" fill="none"/>

      {/* Peacock eye */}
      <circle cx="50" cy="42" r="16" fill={c.eyeOuter} opacity="0.3"/>
      <circle cx="50" cy="42" r="13" fill={c.eyeOuter} opacity="0.7"/>
      <circle cx="50" cy="42" r="9"  fill={c.eyeMid}/>
      <circle cx="50" cy="42" r="6"  fill={c.eyeInner}/>
      <circle cx="50" cy="42" r="3.5" fill={c.eyeCore}/>
      <circle cx="46" cy="39" r="1.5" fill="white" opacity="0.6"/>

      {/* Stem */}
      <line x1="50" y1="42" x2="50" y2="118" stroke={`url(#${gid}_stem)`} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
