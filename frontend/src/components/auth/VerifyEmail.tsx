import React, { useEffect, useMemo, useState } from 'react';

const polygonVariants = [
  '60,35 140,35 175,110 100,165 25,110',
  '55,38 145,32 178,110 105,168 30,116',
  '58,32 148,38 182,108 110,170 32,118',
];

export default function VerifyEmailHero() {
  const [activeShape, setActiveShape] = useState(0);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @keyframes floatPulse {
        0%, 100% { transform: translateY(0px); opacity: 0.95; }
        50% { transform: translateY(-8px); opacity: 1; }
      }
      @keyframes orbit {
        0% { transform: rotate(0deg) translateX(6px) rotate(0deg); }
        100% { transform: rotate(360deg) translateX(6px) rotate(-360deg); }
      }
      @keyframes gentleGlow {
        0%,100% { opacity: .45; }
        50% { opacity: .7; }
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      if (styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setActiveShape(prev => (prev + 1) % polygonVariants.length), 4200);
    return () => window.clearInterval(interval);
  }, []);

  // const polygonPoints = useMemo(() => polygonVariants[activeShape], [activeShape]);

  return (
    <div className="flex-1 bg-[#111112] text-white px-10 py-12 md:px-14 md:py-16 flex flex-col justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#8D8DA6]">Secure your access</p>
        <h1 className="mt-6 text-3xl md:text-4xl font-semibold leading-snug">
          Verify in moments and unlock your personalized learning studio.
        </h1>
        <p className="mt-4 text-base text-[#C7C7D1] max-w-sm">
          Confirm your email to sync progress, activate cohorts, and receive curated updates tailored to your learning path.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="relative h-56 w-full max-w-sm">
          <div className="absolute inset-0 rounded-[32px]  blur-2xl opacity-80" />
          <div className="absolute inset-8 rounded-[24px] " style={{ animation: 'gentleGlow 5s ease-in-out infinite' }} />

          <svg className="absolute inset-0 h-full w-full drop-shadow-[0_24px_56px_rgba(0,0,0,0.55)]" viewBox="0 0 200 200" fill="none">
            {/* <polygon
              points={polygonPoints}
              stroke="url(#polyStroke)"
              strokeWidth={2.2}
              fill="rgba(255,255,255,0.04)"
              strokeLinejoin="round"
              style={{ animation: 'floatPulse 4s ease-in-out infinite' }}
            /> */}
            <defs>
              <linearGradient id="polyStroke" x1="40" y1="30" x2="170" y2="170" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="1" stopColor="#8F8FF6" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="envelopeFill" x1="80" y1="70" x2="120" y2="140" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" stopOpacity="0.08" />
                <stop offset="1" stopColor="#8F8FF6" stopOpacity="0.12" />
              </linearGradient>
            </defs>

            <g transform="translate(100, 112)">
              <rect x="-52" y="-42" width="104" height="84" rx="14" stroke="#FFFFFF" strokeWidth="2.2" fill="url(#envelopeFill)" />
              <path d="M-52 -42 L0 8 L52 -42" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M-52 42 L-4 0 M52 42 L0 -4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="0" cy="12" r="24" stroke="#4CD1B6" strokeWidth="2.2" fill="rgba(76,209,182,0.08)" />
              <path d="M-8 12 L-1 19 L10 2" stroke="#4CD1B6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* <polyline
              points="44,118 100,92 156,138"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              style={{ animation: 'floatPulse 5s ease-in-out infinite .4s' }}
            /> */}
            <circle cx="60" cy="60" r="6" stroke="#FFFFFF" strokeWidth={2} fill="none" style={{ animation: 'floatPulse 4.6s ease-in-out infinite .3s' }} />
            <rect x="154" y="44" width="10" height="10" fill="#FFFFFF" style={{ animation: 'floatPulse 5.4s ease-in-out infinite .2s' }} />
            <rect x="54" y="162" width="34" height="6" fill="#FFFFFF" style={{ animation: 'floatPulse 5s ease-in-out infinite .6s' }} />
            {/* <circle cx="170" cy="162" r="8" stroke="#FFFFFF" strokeWidth={2} fill="none" style={{ animation: 'floatPulse 4.8s ease-in-out infinite .8s' }} /> */}
            {/* <circle cx="100" cy="108" r="5" stroke="#FFFFFF" strokeWidth={2} fill="none" style={{ animation: 'orbit 6s linear infinite' }} /> */}
          </svg>
        </div>

        {/* <div className="flex flex-col gap-4 text-sm text-[#B3B3C2]">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-[#4CD1B6]" />
            <span>Instant verification keeps cohort invites, checkpoints, and badges synced securely.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-[#FFAE5E]" />
            <span>One-time codes protect your workspace while unlocking guided sessions tailored to you.</span>
          </div>
        </div> */}
      </div>
    </div>
  );
}