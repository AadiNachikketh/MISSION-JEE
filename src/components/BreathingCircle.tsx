import React, { useEffect, useState } from 'react';
import { Wind, Play, Pause } from 'lucide-react';

type BreathPhase = 'Inhale slowly' | 'Hold gently' | 'Exhale completely';

export const BreathingCircle: React.FC = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [phase, setPhase] = useState<BreathPhase>('Inhale slowly');
  const [secondsLeft, setSecondsLeft] = useState(4);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // 4-4-6 calming breath cadence: Inhale 4s -> Hold 4s -> Exhale 6s
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        setPhase((currentPhase) => {
          if (currentPhase === 'Inhale slowly') {
            setSecondsLeft(4);
            return 'Hold gently';
          }
          if (currentPhase === 'Hold gently') {
            setSecondsLeft(6);
            return 'Exhale completely';
          }
          setSecondsLeft(4);
          return 'Inhale slowly';
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const targetScale =
    !isActive || prefersReducedMotion
      ? 1
      : phase === 'Inhale slowly'
      ? 1.24
      : phase === 'Hold gently'
      ? 1.24
      : 0.88;

  const phaseInstruction =
    phase === 'Inhale slowly'
      ? 'Breathe in through your nose...'
      : phase === 'Hold gently'
      ? 'Keep your shoulders relaxed...'
      : 'Let all the exam tension go...';

  return (
    <div className="orbital-glass-cyan rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-[#22D3EE]/10 blur-2xl pointer-events-none"
      />

      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          {/* Outer pulse ring */}
          <div
            style={{
              transform: `scale(${targetScale})`,
              opacity: phase === 'Exhale completely' ? 0.38 : 0.78,
              transition: 'transform 3.5s ease-in-out, opacity 3.5s ease-in-out',
            }}
            className="absolute inset-1 rounded-full bg-gradient-to-tr from-[#22D3EE]/30 to-[#00cbe6]/10 border border-[#22D3EE]/50 shadow-[0_0_25px_rgba(34,211,238,0.28)]"
          />

          {/* Inner core orb */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-[#0A0E1F]/90 border border-[#22D3EE]/60 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-display font-semibold tracking-wider text-[#22D3EE] uppercase">
              {phase.split(' ')[0]}
            </span>
            <span className="text-xs font-mono-num text-[#CBD5E1] font-semibold">
              {secondsLeft}s
            </span>
          </div>
        </div>

        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-xs font-display font-semibold tracking-wider text-[#22D3EE] uppercase">
            <Wind className="w-3.5 h-3.5" />
            <span>4-4-6 Nervous System Reset</span>
          </div>
          <p className="text-base font-display font-semibold text-white">
            {phase}
          </p>
          <p className="text-xs text-[#94A3B8]">{phaseInstruction}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsActive((prev) => !prev)}
        aria-label={isActive ? 'Pause breathing guide' : 'Resume breathing guide'}
        className="px-4 py-2 min-h-[44px] rounded-full bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-xs font-display font-semibold tracking-wide flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        {isActive ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span>Pause Guide</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            <span>Resume Guide</span>
          </>
        )}
      </button>
    </div>
  );
};
