import React from 'react';

export default function AuthIllustration() {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center relative bg-gradient-to-br from-emerald-50/80 via-sky-50/40 to-white backdrop-blur-sm">
      <svg
        className="w-full max-w-lg h-full"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 12px 30px rgba(16,185,129,0.18))' }}
      >
        <g style={{ animation: 'float 3s ease-in-out infinite' }}>
          <path d="M120 80 L140 60 L160 80 L160 100 L120 100 Z" stroke="#BDE5D8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M130 60 L130 45 L140 50 L150 45 L150 60" stroke="#F7B8B8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="125" y="85" width="8" height="15" stroke="#CFEADF" strokeWidth="1.5" fill="none" />
          <rect x="147" y="85" width="8" height="15" stroke="#CFEADF" strokeWidth="1.5" fill="none" />
          <circle cx="140" cy="110" r="4" fill="#FDE7A9" />
        </g>

        <g style={{ animation: 'float 4s ease-in-out infinite 1.5s' }}>
          <path d="M290 60 L310 40 L330 60 L330 80 L290 80 Z" stroke="#BDE5D8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M300 40 L300 25 L310 30 L320 25 L320 40" stroke="#F7B8B8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="295" y="65" width="8" height="15" stroke="#CFEADF" strokeWidth="1.5" fill="none" />
          <rect x="317" y="65" width="8" height="15" stroke="#CFEADF" strokeWidth="1.5" fill="none" />
          <circle cx="310" cy="90" r="4" fill="#FDE7A9" />
        </g>

        <g transform="translate(200, 200)">
          <path d="M-60 -40 L-40 -60 L80 -60 L60 -40 Z" stroke="#CFEADF" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <path d="M60 -40 L80 -60 L80 60 L60 40 Z" stroke="#CFEADF" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <rect x="-60" y="-40" width="120" height="80" stroke="#CFEADF" strokeWidth="2" fill="none" rx="4" />
          <rect x="-45" y="-25" width="90" height="50" stroke="#DDF4EC" strokeWidth="1.5" fill="none" rx="2" strokeDasharray="2 1" />
          <line x1="-30" y1="-10" x2="30" y2="-10" stroke="#DDF4EC" strokeWidth="1" strokeOpacity="0.7" />
          <line x1="-30" y1="0" x2="30" y2="0" stroke="#DDF4EC" strokeWidth="1" strokeOpacity="0.7" />
          <line x1="-30" y1="10" x2="30" y2="10" stroke="#DDF4EC" strokeWidth="1" strokeOpacity="0.7" />
          <rect x="-25" y="40" width="50" height="15" stroke="#CFEADF" strokeWidth="2" fill="none" rx="2" />
          <rect x="-10" y="55" width="20" height="8" stroke="#CFEADF" strokeWidth="2" fill="none" rx="1" />
          <path d="M-60 -40 L-40 -60" stroke="#CFEADF" strokeWidth="2" />
          <path d="M60 -40 L80 -60" stroke="#CFEADF" strokeWidth="2" />
          <path d="M-60 40 L-40 60 L80 60 L60 40" stroke="#DDF4EC" strokeWidth="2" strokeDasharray="3 2" />
        </g>

        <ellipse cx="200" cy="320" rx="140" ry="40" stroke="#DDF4EC" strokeWidth="2" fill="none" />
        <ellipse cx="200" cy="315" rx="135" ry="35" stroke="#E8F9F1" strokeWidth="1" fill="none" strokeOpacity="0.6" />
        <ellipse cx="120" cy="315" rx="20" ry="12" fill="#F9D9D9" fillOpacity="0.85" />
        <ellipse cx="170" cy="325" rx="18" ry="10" fill="#FFF1B8" fillOpacity="0.85" />
        <ellipse cx="220" cy="320" rx="22" ry="14" fill="#BFEDE3" fillOpacity="0.9" />
        <ellipse cx="270" cy="310" rx="19" ry="11" fill="#F9D9D9" fillOpacity="0.85" />
        <circle cx="80" cy="150" r="6" stroke="#CFEADF" strokeWidth="1.5" fill="none" style={{ animation: 'float 5s ease-in-out infinite 2s' }} />
        <path d="M350 180 L360 170 L370 180 L360 190 Z" stroke="#BFEDE3" strokeWidth="1.5" fill="#BFEDE3" fillOpacity="0.6" style={{ animation: 'float 6s ease-in-out infinite 3s' }} />
        <circle cx="200" cy="280" r="2" fill="#E8F9F1" />
        <line x1="180" y1="270" x2="220" y2="270" stroke="#E8F9F1" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2 3" />
      </svg>
    </div>
  );
}