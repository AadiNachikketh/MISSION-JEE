import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Flame } from 'lucide-react';

interface TimerProps {
  initialMinutes: number;
  taskTitle: string;
  autoStart?: boolean;
  onComplete?: () => void;
  onClose?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  initialMinutes,
  taskTitle,
  autoStart = true,
  onComplete,
}) => {
  const totalSecondsInitial = Math.max(1, initialMinutes) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSecondsInitial);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const newTotal = Math.max(1, initialMinutes) * 60;
    setSecondsLeft(newTotal);
    setIsRunning(autoStart);
    setIsCompleted(false);
  }, [initialMinutes, taskTitle, autoStart]);

  useEffect(() => {
    if (!isRunning || isCompleted) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          setIsCompleted(true);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isCompleted, onComplete]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPct = Math.min(
    100,
    Math.max(0, ((totalSecondsInitial - secondsLeft) / totalSecondsInitial) * 100)
  );

  const handleReset = () => {
    setSecondsLeft(totalSecondsInitial);
    setIsCompleted(false);
    setIsRunning(false);
  };

  return (
    <div
      data-testid="active-focus-timer"
      className="mt-4 rounded-2xl bg-[#0A0E1F]/90 border border-[#7C5CFF]/50 p-4 shadow-[0_0_25px_rgba(124,92,255,0.18)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-display font-semibold tracking-wider text-[#22D3EE] uppercase">
            <Flame className="w-3.5 h-3.5 text-[#7C5CFF]" />
            <span>{isCompleted ? 'Sprint Complete!' : isRunning ? 'Live Focus Cockpit' : 'Timer Paused'}</span>
          </div>
          <p className="text-sm text-[#CBD5E1] font-medium line-clamp-2">
            {taskTitle}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <div
            aria-live="polite"
            className="text-2xl sm:text-3xl font-display font-bold font-mono-num text-white tracking-wider px-3 py-1.5 rounded-xl bg-[#131938] border border-[#2A3362]"
          >
            {formattedTime}
          </div>

          <button
            type="button"
            onClick={() => setIsRunning((prev) => !prev)}
            disabled={isCompleted}
            aria-label={isRunning ? 'Pause countdown timer' : 'Start countdown timer'}
            className="min-h-[44px] px-4 py-2 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#633BF3] hover:opacity-95 text-white text-xs font-display font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset countdown timer"
            className="min-h-[44px] min-w-[44px] rounded-full bg-[#131938] hover:bg-[#1b2248] border border-[#2A3362] text-[#CBD5E1] flex items-center justify-center transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trajectory Progress Bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-[#1E264F] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#22D3EE] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {isCompleted && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Solid block locked in! Take a 3-minute water break before your next round.</span>
        </div>
      )}
    </div>
  );
};
