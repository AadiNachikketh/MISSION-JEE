import React, { useEffect, useState } from 'react';

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

const DETERMINISTIC_STARS: Star[] = Array.from({ length: 56 }, (_, i) => {
  const seed1 = ((i * 73 + 19) % 97) / 97;
  const seed2 = ((i * 41 + 31) % 89) / 89;
  const colors = ['#FFFFFF', '#dee1fa', '#cabeff', '#5de6ff', '#ffba4b'];
  return {
    id: i,
    top: `${(seed1 * 98 + 1).toFixed(2)}%`,
    left: `${(seed2 * 98 + 1).toFixed(2)}%`,
    size: i % 9 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.2,
    opacity: 0.25 + (i % 5) * 0.14,
    duration: 3.5 + (i % 6) * 1.1,
    delay: (i % 7) * 0.6,
    color: colors[i % colors.length],
  };
});

export const StarfieldBackground: React.FC = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      style={{
        background:
          'radial-gradient(circle at 18% 12%, rgba(124, 92, 255, 0.13) 0%, transparent 42%), radial-gradient(circle at 84% 22%, rgba(34, 211, 238, 0.10) 0%, transparent 38%), radial-gradient(circle at 52% 88%, rgba(255, 176, 32, 0.07) 0%, transparent 45%), linear-gradient(180deg, #0A0E1F 0%, #0E132B 100%)',
      }}
    >
      {/* Subtle orbital grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #5de6ff 1px, transparent 1px), linear-gradient(to bottom, #7c5cff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Starfield particles */}
      {DETERMINISTIC_STARS.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            opacity: reducedMotion ? star.opacity * 0.8 : star.opacity,
            boxShadow:
              star.size > 1.6
                ? `0 0 ${star.size * 3}px ${star.color}`
                : undefined,
          }}
        />
      ))}
    </div>
  );
};
