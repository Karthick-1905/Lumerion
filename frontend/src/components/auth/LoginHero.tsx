import { useEffect, useMemo, useState } from 'react';

const polygonVariants = [
  '24,28 138,18 186,88 122,174 36,136',
  '18,34 146,16 188,76 118,182 28,120',
  '32,24 134,28 178,96 108,170 40,130',
];

export default function LoginHero() {
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
    `;
    document.head.appendChild(styleTag);
    return () => {
      if (styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveShape(prev => (prev + 1) % polygonVariants.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, []);

  const polygonPoints = useMemo(() => polygonVariants[activeShape], [activeShape]);

  return (
    <div className="flex-1 bg-[#111112] text-white px-10 py-12 md:px-14 md:py-16 flex flex-col justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#8D8DA6]">Return to your studio</p>
        <h1 className="mt-6 text-3xl md:text-4xl font-semibold leading-snug">
          Dive back into curated lessons, cohort feedback, and live critiques.
        </h1>
        <p className="mt-4 text-base text-[#C7C7D1] max-w-sm">
          Resume your learning path with saved progress, bookmarked resources, and upcoming mentor sessions.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-8">
        <div className="relative h-56 w-full max-w-sm">
          <div className="absolute inset-0 bg-linear-to-br from-[#202028] via-[#16161C] to-[#101015] opacity-80 blur-2xl" />
          <svg className="absolute inset-0 h-full w-full drop-shadow-[0_20px_45px_rgba(0,0,0,0.55)]" viewBox="0 0 200 200" fill="none">
            <polygon
              points={polygonPoints}
              className="transition-all duration-800 ease-out"
              stroke="#FFFFFF"
              strokeWidth={2.2}
              fill="rgba(255,255,255,0.02)"
              strokeLinejoin="round"
              style={{ animation: 'floatPulse 4s ease-in-out infinite' }}
            />
            <polyline
              points="34,130 96,96 140,152"
              stroke="#FFFFFF"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              style={{ animation: 'floatPulse 5s ease-in-out infinite .5s' }}
            />
            <circle
              cx="98"
              cy="112"
              r="4"
              stroke="#FFFFFF"
              strokeWidth={2}
              fill="none"
              style={{ animation: 'orbit 6s linear infinite' }}
            />
            <circle cx="58" cy="48" r="6" stroke="#FFFFFF" strokeWidth={2} fill="none" style={{ animation: 'floatPulse 4.6s ease-in-out infinite .4s' }} />
            <rect x="152" y="30" width="10" height="10" fill="#FFFFFF" style={{ animation: 'floatPulse 5.4s ease-in-out infinite .2s' }} />
            <rect x="48" y="164" width="34" height="6" fill="#FFFFFF" style={{ animation: 'floatPulse 5s ease-in-out infinite .8s' }} />
            <circle cx="168" cy="176" r="8" stroke="#FFFFFF" strokeWidth={2} fill="none" style={{ animation: 'floatPulse 4.8s ease-in-out infinite .6s' }} />
          </svg>
        </div>

        {/* <div className="flex flex-col gap-4 text-sm text-[#B3B3C2]">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-[#4CD1B6]" />
            <span>Track streaks, feedback notes, and upcoming live sessions in one dashboard.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-[#FFAE5E]" />
            <span>Revisit downloadable templates, workshop recordings, and peer reviews instantly.</span>
          </div>
        </div> */}
      </div>
    </div>
  );
}