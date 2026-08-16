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
      fanBg:    '#0d5c4e',
      fanMid:   '#14b8a6',
      fanLight: '#5eead4',
      rachis:   '#34d399',
      eyeOuter: '#6ee7b7',
      eyeMid:   '#2563eb',
      eyeCore:  '#1e3a8a',
      body:     '#1d4ed8',
      bodyHi:   '#60a5fa',
      head:     '#1e40af',
      crest:    '#34d399',
      beak:     '#fbbf24',
      legs:     '#92400e',
      glow:     'rgba(20,184,166,0.45)',
    },
    white: {
      fanBg:    '#334155',
      fanMid:   '#94a3b8',
      fanLight: '#f1f5f9',
      rachis:   '#e2e8f0',
      eyeOuter: '#f8fafc',
      eyeMid:   '#94a3b8',
      eyeCore:  '#1e293b',
      body:     '#64748b',
      bodyHi:   '#cbd5e1',
      head:     '#475569',
      crest:    '#e2e8f0',
      beak:     '#fbbf24',
      legs:     '#78716c',
      glow:     'rgba(148,163,184,0.45)',
    },
    gold: {
      fanBg:    '#78350f',
      fanMid:   '#d97706',
      fanLight: '#fde68a',
      rachis:   '#fbbf24',
      eyeOuter: '#fef3c7',
      eyeMid:   '#f59e0b',
      eyeCore:  '#451a03',
      body:     '#92400e',
      bodyHi:   '#fbbf24',
      head:     '#78350f',
      crest:    '#fcd34d',
      beak:     '#fbbf24',
      legs:     '#57534e',
      glow:     'rgba(251,191,36,0.45)',
    },
  };

  const c = isWhite ? palette.white : isGold ? palette.gold : palette.normal;
  const uid = useId();
  const gid = `pc_${uid.replace(/:/g, '')}_${resolvedType}`;

  // Fan origin (top of body / where all feathers radiate from)
  const fx = 50, fy = 76;

  // 11 feather tips + their pre-calculated eye spot positions (at ~78% along each rachis)
  const feathers = [
    { t: [3,  62], e: [16, 66] },
    { t: [4,  42], e: [16, 52] },
    { t: [10, 24], e: [20, 38] },
    { t: [23, 12], e: [30, 29] },
    { t: [36,  5], e: [39, 23] },
    { t: [50,  3], e: [50, 21] },
    { t: [64,  5], e: [61, 23] },
    { t: [77, 12], e: [70, 29] },
    { t: [90, 24], e: [80, 38] },
    { t: [96, 42], e: [84, 52] },
    { t: [97, 62], e: [84, 66] },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 118"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0px 2px 5px ${c.glow})`, overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`${gid}_fan`} cx="50%" cy="90%" r="95%">
          <stop offset="0%"   stopColor={c.fanMid}  />
          <stop offset="70%"  stopColor={c.fanBg}   />
          <stop offset="100%" stopColor={c.fanBg} stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id={`${gid}_body`} cx="50%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={c.bodyHi} />
          <stop offset="100%" stopColor={c.body}   />
        </radialGradient>
      </defs>

      {/* ── Fan dome background ── */}
      <path
        d={`M 3 ${fy} C 3 4, 97 4, 97 ${fy} Z`}
        fill={`url(#${gid}_fan)`}
        opacity="0.88"
      />

      {/* ── Rachis lines (feather stems) ── */}
      {feathers.map((f, i) => (
        <line
          key={`r${i}`}
          x1={fx} y1={fy}
          x2={f.t[0]} y2={f.t[1]}
          stroke={c.rachis}
          strokeWidth="0.9"
          opacity="0.75"
        />
      ))}

      {/* ── Feather edge fringe (fine barbs) ── */}
      {feathers.map((f, i) => (
        <line
          key={`b${i}`}
          x1={fx} y1={fy}
          x2={f.t[0]} y2={f.t[1]}
          stroke={c.fanLight}
          strokeWidth="2.5"
          opacity="0.12"
        />
      ))}

      {/* ── Eye spots on feathers ── */}
      {feathers.map((f, i) => (
        <g key={`eye${i}`}>
          <circle cx={f.e[0]} cy={f.e[1]} r="4.8" fill={c.eyeOuter} opacity="0.55" />
          <circle cx={f.e[0]} cy={f.e[1]} r="3.2" fill={c.eyeMid} />
          <circle cx={f.e[0]} cy={f.e[1]} r="1.7" fill={c.eyeCore} />
        </g>
      ))}

      {/* ── Body (torso) ── */}
      <ellipse cx={50} cy={91} rx={11} ry={15} fill={`url(#${gid}_body)`} />

      {/* Wing/chest iridescent patches */}
      <ellipse cx={43} cy={90} rx={5} ry={9} fill={c.fanMid} opacity="0.5" />
      <ellipse cx={57} cy={90} rx={5} ry={9} fill={c.fanMid} opacity="0.5" />
      <ellipse cx={50} cy={88} rx={4} ry={6} fill={c.bodyHi} opacity="0.35" />

      {/* ── Neck ── */}
      <ellipse cx={50} cy={78} rx={5} ry={7} fill={c.head} />

      {/* ── Head ── */}
      <circle cx={50} cy={71} r={7} fill={c.head} />
      <circle cx={50} cy={71} r={4} fill={c.bodyHi} opacity="0.5" />

      {/* ── Crest feathers ── */}
      <line x1={47} y1={65} x2={44} y2={58} stroke={c.crest} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx={44} cy={57} r="1.6" fill={c.eyeMid} />
      <line x1={50} y1={64} x2={50} y2={57} stroke={c.crest} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx={50} cy={56} r="1.6" fill={c.eyeMid} />
      <line x1={53} y1={65} x2={56} y2={58} stroke={c.crest} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx={56} cy={57} r="1.6" fill={c.eyeMid} />

      {/* ── Beak ── */}
      <path d="M 47 73 L 50 77 L 53 73" fill={c.beak} />

      {/* ── Eyes (face) ── */}
      <circle cx={46} cy={70} r="1.2" fill={c.eyeCore} />
      <circle cx={54} cy={70} r="1.2" fill={c.eyeCore} />

      {/* ── Legs ── */}
      <line x1={46} y1={106} x2={43} y2={114} stroke={c.legs} strokeWidth="1.3" strokeLinecap="round" />
      <line x1={54} y1={106} x2={57} y2={114} stroke={c.legs} strokeWidth="1.3" strokeLinecap="round" />
      {/* Feet / toes */}
      <line x1={43} y1={114} x2={38} y2={115} stroke={c.legs} strokeWidth="1" strokeLinecap="round" />
      <line x1={43} y1={114} x2={42} y2={117} stroke={c.legs} strokeWidth="1" strokeLinecap="round" />
      <line x1={43} y1={114} x2={46} y2={117} stroke={c.legs} strokeWidth="1" strokeLinecap="round" />
      <line x1={57} y1={114} x2={62} y2={115} stroke={c.legs} strokeWidth="1" strokeLinecap="round" />
      <line x1={57} y1={114} x2={58} y2={117} stroke={c.legs} strokeWidth="1" strokeLinecap="round" />
      <line x1={57} y1={114} x2={54} y2={117} stroke={c.legs} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
