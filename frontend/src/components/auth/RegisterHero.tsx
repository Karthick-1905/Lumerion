import React, { useEffect, useMemo, useState } from 'react';

const polygonVariants = [
  '28,26 136,18 182,88 116,166 34,132',
  '18,32 144,14 184,80 122,178 26,118',
  '24,22 132,30 176,94 102,176 30,128',
  '32,28 140,16 188,82 128,170 38,138',
];

const helperShapes = [
  { type: 'circle', cx: 58, cy: 48, r: 6 },
  { type: 'rect', x: 152, y: 30, w: 10, h: 10 },
  { type: 'rect', x: 46, y: 162, w: 36, h: 6 },
  { type: 'circle', cx: 170, cy: 172, r: 8 },
];

export default function RegisterHero() {
  const [activeShape, setActiveShape] = useState(0);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @keyframes floatPulse {
        0%, 100% { transform: translateY(0px); opacity: 0.9; }
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
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveShape(prev => (prev + 1) % polygonVariants.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  const polygonPoints = useMemo(() => polygonVariants[activeShape], [activeShape]);

  return (
    <div className="flex-1 bg-[#111112] text-white px-10 py-12 md:px-14 md:py-16 flex flex-col justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#8D8DA6]">Elevate your skills</p>
        <h1 className="mt-6 text-3xl md:text-4xl font-semibold leading-snug">
          Design learning experiences crafted for creative technologists.
        </h1>
        <p className="mt-4 text-base text-[#C7C7D1] max-w-sm">
          Explore structured paths, interactive critiques, and cohorts designed to help you ship polished projects faster.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-8">
        <div className="relative h-56 w-full max-w-sm">
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#202028] via-[#16161C] to-[#101015] opacity-80 blur-2xl" />
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
              points="34,128 96,92 138,150"
              stroke="#FFFFFF"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              style={{ animation: 'floatPulse 5s ease-in-out infinite .6s' }}
            />
            <circle
              cx="98"
              cy="110"
              r="4"
              stroke="#FFFFFF"
              strokeWidth={2}
              fill="none"
              style={{ animation: 'orbit 6s linear infinite' }}
            />
            {helperShapes.map((shape, index) => {
              if (shape.type === 'circle') {
                return (
                  <circle
                    key={index}
                    cx={shape.cx}
                    cy={shape.cy}
                    r={shape.r}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    fill="none"
                    style={{ animation: `floatPulse 4.5s ease-in-out infinite ${index * 0.4}s` }}
                  />
                );
              }
              return (
                <rect
                  key={index}
                  x={shape.x}
                  y={shape.y}
                  width={shape.w}
                  height={shape.h}
                  fill="#FFFFFF"
                  style={{ animation: `floatPulse 5.2s ease-in-out infinite ${index * 0.3}s` }}
                />
              );
            })}
          </svg>
        </div>

        {/* <div className="flex flex-col gap-4 text-sm text-[#B3B3C2]">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-[#4CD1B6]" />
            <span>Guided cohorts with mentors and peer critique sessions each week.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-[#FFAE5E]" />
            <span>Modular lessons, live workshops, and recordings you can rewatch anytime.</span>
          </div>
        </div> */}
      </div>
    </div>
  );
}