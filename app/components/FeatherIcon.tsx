import React from 'react';

export type FeatherType = 'normal' | 'white' | 'gold';

interface FeatherIconProps {
  streak: number;
  size?: number;
}

export default function FeatherIcon({ streak, size = 18 }: FeatherIconProps) {
  let type: FeatherType = 'normal';
  if (streak >= 30) type = 'gold';
  else if (streak >= 7) type = 'white';

  const isWhite = type === 'white';
  const isGold = type === 'gold';

  // Colors
  const stem = isWhite ? '#e2e8f0' : (isGold ? '#fcd34d' : '#34d399');
  const barbsOuter = isWhite ? '#f8fafc' : (isGold ? '#fbbf24' : '#10b981');
  const barbsInner = isWhite ? '#e2e8f0' : (isGold ? '#f59e0b' : '#059669');
  
  const eyeOuter = isWhite ? '#cbd5e1' : (isGold ? '#fef3c7' : '#f59e0b');
  const eyeMid = isWhite ? '#94a3b8' : (isGold ? '#fde68a' : '#3b82f6');
  const eyeInner = isWhite ? '#64748b' : (isGold ? '#d97706' : '#1e3a8a');

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
    >
      {/* Radiating Barbs */}
      <path d="M50 90 C 20 60, 20 20, 50 10 C 80 20, 80 60, 50 90 Z" fill={barbsOuter} opacity="0.8"/>
      <path d="M50 85 C 30 60, 30 25, 50 15 C 70 25, 70 60, 50 85 Z" fill={barbsInner} opacity="0.9"/>
      
      {/* Eye Outer */}
      <ellipse cx="50" cy="35" rx="15" ry="20" fill={eyeOuter} />
      {/* Eye Mid */}
      <ellipse cx="50" cy="38" rx="10" ry="14" fill={eyeMid} />
      {/* Eye Inner (The core dot) */}
      <circle cx="50" cy="40" r="6" fill={eyeInner} />
      
      {/* Stem */}
      <path d="M50 10 Q 50 50 50 95" stroke={stem} strokeWidth="2" strokeLinecap="round" />
      
      {/* Texture Lines (Left) */}
      <path d="M50 20 Q 35 30 25 40" stroke={stem} strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M50 30 Q 30 45 22 55" stroke={stem} strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M50 40 Q 32 55 25 70" stroke={stem} strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M50 50 Q 35 65 30 80" stroke={stem} strokeWidth="1" fill="none" opacity="0.6"/>
      
      {/* Texture Lines (Right) */}
      <path d="M50 20 Q 65 30 75 40" stroke={stem} strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M50 30 Q 70 45 78 55" stroke={stem} strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M50 40 Q 68 55 75 70" stroke={stem} strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M50 50 Q 65 65 70 80" stroke={stem} strokeWidth="1" fill="none" opacity="0.6"/>
    </svg>
  );
}
