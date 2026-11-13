import React, { useState } from 'react';
import {
  Trophy,
  Check,
  Sparkles,
  Flame,
  Flag,
  Compass,
  X,
  Plus,
  RotateCcw,
  Lock,
  Unlock,
  ArrowRight,
  GraduationCap,
  CalendarCheck2,
  AlertCircle,
} from 'lucide-react';
import {
  DEFAULT_STAGE_CHECKLISTS,
  MissionTask,
  ROADMAP_STAGE_ORDER,
  RoadmapStageId,
  UserProfile,
  buildCompanionSystemPrompt,
  canUnlockStage,
  formatStrugglesList,
  formatSyllabusTarget,
  isStageComplete,
} from '../utils/lakshyaLogic';
import { callGrok } from '../api/grok';

interface RoadmapProps {
  profile: UserProfile;
  onUpdateStage: (stage: RoadmapStageId) => void;
  onToggleStageTask: (stage: RoadmapStageId, taskIndex: number) => void;
  tasks: MissionTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string) => void;
  onResetTasks: () => void;
}

const STAGES: {
  id: RoadmapStageId;
  title: string;
  subtitle: string;
}[] = [
  { id: 'foundation', title: 'Foundation', subtitle: 'Core concepts & NCERT mastery' },
  { id: 'practice', title: 'Practice', subtitle: 'Chapter PYQs & problem stamina' },
  { id: 'mocks', title: 'Mocks', subtitle: 'Full-syllabus tests & error logs' },
  { id: 'sprint', title: 'Final Sprint', subtitle: 'High-weightage revision & speed' },
  { id: 'jeeday', title: 'JEE Day', subtitle: 'Calm execution & peak rank' },
];

const CONFETTI_PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 3.6 + 2) % 96}%`,
  color: ['#FFB020', '#7C5CFF', '#22D3EE', '#FFFFFF', '#F59E0B'][i % 5],
  delay: (i % 7) * 0.06,
  xOffset: ((i % 5) - 2) * 24,
}));

export const Roadmap: React.FC<RoadmapProps> = ({
  profile,
  onUpdateStage,
  onToggleStageTask,
  tasks,
  onToggleTask,
  onAddTask,
  onResetTasks,
}) => {
  const currentStage: RoadmapStageId = profile.roadmapStage || 'foundation';
  const currentIdx = STAGES.findIndex((s) => s.id === currentStage);
  const currentStageMeta = STAGES[currentIdx] || STAGES[0];
  const nextStageMeta =
    currentIdx >= 0 && currentIdx < STAGES.length - 1
      ? STAGES[currentIdx + 1]
      : null;

  const [showConfetti, setShowConfetti] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [lockedWarning, setLockedWarning] = useState<string>('');

  // "Remind me why I started" full-screen modal state
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [whyMessage, setWhyMessage] = useState('');
  const [whyLoading, setWhyLoading] = useState(false);
  const [whyError, setWhyError] = useState('');

  const completedCount = tasks.filter((t) => t.completed).length;

  const stageChecklistTitles = DEFAULT_STAGE_CHECKLISTS[currentStage] || [];
  const currentStageChecks = profile.stageProgress?.[currentStage] || [
    false,
    false,
    false,
  ];
  const stageCheckedCount = stageChecklistTitles.filter((_, idx) =>
    Boolean(currentStageChecks[idx])
  ).length;
  const currentStageAllDone = isStageComplete(
    currentStage,
    profile.stageProgress
  );

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2600);
  };

  const handleStageSelect = (targetStage: RoadmapStageId) => {
    const unlocked = canUnlockStage(targetStage, profile.stageProgress);
    if (!unlocked) {
      const targetIdx = ROADMAP_STAGE_ORDER.indexOf(targetStage);
      const firstIncompleteIdx = ROADMAP_STAGE_ORDER.slice(
        0,
        targetIdx
      ).findIndex((st) => !isStageComplete(st, profile.stageProgress));
      const blockingStageTitle =
        STAGES[firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0]?.title ||
        'current stage';
      const targetStageTitle =
        STAGES.find((s) => s.id === targetStage)?.title || targetStage;
      setLockedWarning(
        `Stage Locked: You cannot advance to "${targetStageTitle}" until you complete all checkboxes in "${blockingStageTitle}" below!`
      );
      return;
    }
    setLockedWarning('');
    onUpdateStage(targetStage);
  };

  const handleStageCheckboxToggle = (idx: number) => {
    const willBeChecked = !currentStageChecks[idx];
    setLockedWarning('');
    onToggleStageTask(currentStage, idx);
    if (willBeChecked) {
      triggerConfetti();
    }
  };

  const handleTaskClick = (task: MissionTask) => {
    const willBeCompleted = !task.completed;
    onToggleTask(task.id);
    if (willBeCompleted) {
      triggerConfetti();
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim());
    setNewTaskTitle('');
    setShowAddInput(false);
  };

  const strugglesLabel = formatStrugglesList(
    profile.struggles,
    profile.struggle
  );
  const syllabusLabel = formatSyllabusTarget(profile.syllabusTarget);

  const handleRemindWhyIStarted = async () => {
    setWhyModalOpen(true);
    setWhyLoading(true);
    setWhyError('');
    setWhyMessage('');

    try {
      const systemPrompt = buildCompanionSystemPrompt('mission', profile);
      const res = await callGrok({
        companion: 'mission',
        profile,
        systemPrompt,
        purpose: 'why-i-started',
        messages: [
          {
            role: 'user',
            content: `Remind me why I started working toward "${profile.goal}". Give me a short, personal, deeply grounding big-brother/big-sister message (around 100-140 words) that reconnects me to my dream when I feel tired of fighting ${strugglesLabel}.`,
          },
        ],
        stream: true,
        onChunk: (partial) => setWhyMessage(partial),
      });
      setWhyMessage(res.reply);
    } catch {
      setWhyError(
        "Couldn't reach the AI. Check your connection or API key and try again."
      );
    } finally {
      setWhyLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Game-Style 5-Stage Gated Campaign Roadmap */}
      <div className="orbital-glass-gold rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-5">
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FFB020]/12 blur-3xl pointer-events-none"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-display font-semibold tracking-wider text-[#FFB020] uppercase">
              <Compass className="w-3.5 h-3.5" />
              <span>Campaign Trajectory · JEE Mains &amp; Adv {profile.examYear}</span>
            </div>
            <h2 className="text-lg font-display font-bold text-white mt-0.5">
              Stage-Gated Mission Campaign
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#CBD5E1]">
              {profile.studentClass && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#0A0E1F]/80 border border-[#2A3362]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>{profile.studentClass}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#0A0E1F]/80 border border-[#2A3362]">
                <CalendarCheck2 className="w-3.5 h-3.5 text-[#FFB020]" />
                <span>Syllabus Target: {syllabusLabel}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemindWhyIStarted}
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FFB020] to-[#F59E0B] hover:shadow-[0_0_24px_rgba(255,176,32,0.45)] text-[#0A0E1F] font-display font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>Remind me why I started</span>
          </button>
        </div>

        {/* 5 Stages Track with Stage-Gate Locking */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 relative">
          {STAGES.map((stage, index) => {
            const isCurrent = stage.id === currentStage;
            const stageDone = isStageComplete(stage.id, profile.stageProgress);
            const stageUnlocked = canUnlockStage(
              stage.id,
              profile.stageProgress
            );

            return (
              <button
                key={stage.id}
                type="button"
                data-testid={`campaign-stage-${stage.id}`}
                aria-disabled={!stageUnlocked}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => handleStageSelect(stage.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 ${
                  isCurrent
                    ? 'bg-[#FFB020]/18 border-[#FFB020] shadow-[0_0_22px_rgba(255,176,32,0.22)]'
                    : stageDone
                    ? 'bg-[#131938]/85 border-[#22D3EE]/50 text-[#CBD5E1]'
                    : stageUnlocked
                    ? 'bg-[#0A0E1F]/80 border-[#7C5CFF]/50 text-white hover:border-[#FFB020]/60'
                    : 'bg-[#0A0E1F]/45 border-[#2A3362]/70 text-[#64748B] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between w-auto sm:w-full shrink-0 gap-1.5">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold font-mono-num ${
                      isCurrent
                        ? 'bg-[#FFB020] text-[#0A0E1F]'
                        : stageDone
                        ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/50'
                        : stageUnlocked
                        ? 'bg-[#7C5CFF]/25 text-white border border-[#7C5CFF]'
                        : 'bg-[#131938] text-[#64748B] border border-[#2A3362]'
                    }`}
                  >
                    {stageDone ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : !stageUnlocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      `0${index + 1}`
                    )}
                  </span>
                  {isCurrent ? (
                    <span className="hidden sm:inline-block text-[10px] font-display font-bold uppercase tracking-wider text-[#FFB020]">
                      Active
                    </span>
                  ) : !stageUnlocked ? (
                    <span className="hidden sm:inline-block text-[10px] font-display font-semibold uppercase tracking-wider text-[#64748B]">
                      Locked
                    </span>
                  ) : stageDone ? (
                    <span className="hidden sm:inline-block text-[10px] font-display font-semibold uppercase tracking-wider text-[#22D3EE]">
                      Cleared
                    </span>
                  ) : (
                    <span className="hidden sm:inline-block text-[10px] font-display font-semibold uppercase tracking-wider text-[#cabeff]">
                      Unlocked
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                    <span>{stage.title}</span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] line-clamp-2 mt-0.5">
                    {stage.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Locked Stage Alert Banner if user clicked a locked stage */}
        {lockedWarning && (
          <div
            role="alert"
            data-testid="locked-stage-warning"
            className="p-3.5 rounded-2xl bg-[#93000a]/40 border border-[#ffb4ab]/50 text-xs sm:text-sm text-[#ffdad6] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#ffb4ab] shrink-0" />
              <span>{lockedWarning}</span>
            </div>
            <button
              type="button"
              onClick={() => setLockedWarning('')}
              className="text-xs font-display font-semibold text-white underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Stage Mandatory Checklist Gate */}
        <div className="rounded-2xl bg-[#0A0E1F]/80 border border-[#2A3362] p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#22D3EE]">
                {currentStageAllDone ? (
                  <Unlock className="w-3.5 h-3.5 text-[#22D3EE]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#FFB020]" />
                )}
                <span>
                  Stage {currentIdx + 1} Gate: {currentStageMeta.title} Checkboxes
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {nextStageMeta
                  ? `Complete all ${stageChecklistTitles.length} checkboxes in ${currentStageMeta.title} to unlock ${nextStageMeta.title}.`
                  : `Complete all ${stageChecklistTitles.length} checkboxes to finish your final JEE Day stage!`}
              </p>
            </div>
            <span
              data-testid="stage-gate-progress"
              className="text-xs font-mono-num font-bold px-3 py-1 rounded-full bg-[#131938] border border-[#2A3362] text-[#FFB020]"
            >
              {stageCheckedCount}/{stageChecklistTitles.length} Completed
            </span>
          </div>

          <div className="space-y-2">
            {stageChecklistTitles.map((item, idx) => {
              const checked = Boolean(currentStageChecks[idx]);
              return (
                <button
                  key={`${currentStage}-gate-${idx}`}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  data-testid={`stage-gate-checkbox-${idx}`}
                  onClick={() => handleStageCheckboxToggle(idx)}
                  className={`w-full min-h-[48px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    checked
                      ? 'bg-[#22D3EE]/12 border-[#22D3EE]/60 text-white'
                      : 'bg-[#131938]/75 border-[#2A3362] hover:border-[#FFB020]/50 text-[#dee1fa]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'bg-[#22D3EE] text-[#001f25]'
                          : 'bg-[#0A0E1F] border border-[#64748B]'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        checked ? 'line-through text-[#CBD5E1]' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-num text-[#94A3B8] shrink-0">
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {currentStageAllDone && nextStageMeta && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#2A3362]/70">
              <span className="text-xs text-[#22D3EE] font-display font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  All {currentStageMeta.title} requirements complete! You can now advance to {nextStageMeta.title}.
                </span>
              </span>
              <button
                type="button"
                data-testid="advance-next-stage-btn"
                onClick={() => handleStageSelect(nextStageMeta.id)}
                className="min-h-[42px] px-5 py-2 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#00cbe6] text-[#001f25] font-display font-bold text-xs flex items-center gap-2 self-start sm:self-center cursor-pointer whitespace-nowrap"
              >
                <span>Advance to {nextStageMeta.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Today's Mission — 3 Checkable Daily Tasks + Confetti */}
      <div className="orbital-glass-1 rounded-3xl p-5 sm:p-6 relative overflow-hidden">
        {/* Confetti overlay burst */}
        {showConfetti && (
          <div
            aria-hidden="true"
            data-testid="mission-confetti"
            className="absolute inset-0 pointer-events-none overflow-hidden z-20"
          >
            {CONFETTI_PIECES.map((piece) => (
              <span
                key={piece.id}
                style={{
                  left: piece.left,
                  backgroundColor: piece.color,
                  animationDelay: `${piece.delay}s`,
                  transform: `translateY(20px) translateX(${piece.xOffset}px)`,
                }}
                className="absolute top-2 w-2.5 h-2.5 rounded-sm shadow-sm animate-bounce"
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-[#FFB020]" />
            <div>
              <h3 className="text-base font-display font-bold text-white">
                Today’s Mission Targets
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Check off each target as you finish—every brick counts toward{' '}
                <span className="text-[#CBD5E1] font-medium">{profile.goal}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              data-testid="mission-progress-count"
              className="text-xs font-mono-num font-semibold text-[#FFB020] px-3 py-1 rounded-full bg-[#FFB020]/12 border border-[#FFB020]/30"
            >
              {completedCount}/{tasks.length} Completed
            </span>
            <button
              type="button"
              onClick={() => setShowAddInput((prev) => !prev)}
              aria-label="Add custom mission task"
              className="min-h-[38px] px-3 py-1.5 rounded-full bg-[#131938] hover:bg-[#1c244d] border border-[#2A3362] text-xs text-[#CBD5E1] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <button
              type="button"
              onClick={onResetTasks}
              aria-label="Reset today's tasks"
              className="min-h-[38px] min-w-[38px] rounded-full bg-[#131938] hover:bg-[#1c244d] border border-[#2A3362] text-xs text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showAddInput && (
          <form onSubmit={handleCreateTask} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a concrete target for today..."
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#0A0E1F] border border-[#2A3362] text-xs text-white focus:border-[#FFB020] focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 h-10 rounded-xl bg-[#FFB020] text-[#0A0E1F] font-display font-bold text-xs cursor-pointer"
            >
              Add Target
            </button>
          </form>
        )}

        <div className="space-y-2.5">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              role="checkbox"
              aria-checked={task.completed}
              onClick={() => handleTaskClick(task)}
              className={`w-full min-h-[52px] p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                task.completed
                  ? 'bg-[#131938]/50 border-[#FFB020]/50 text-[#94A3B8]'
                  : 'bg-[#0A0E1F]/75 border-[#2A3362] hover:border-[#FFB020]/50 text-white'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-[#FFB020] text-[#0A0E1F] shadow-[0_0_12px_rgba(255,176,32,0.5)]'
                      : 'bg-[#131938] border border-[#2A3362]'
                  }`}
                >
                  {task.completed && <Check className="w-4 h-4 stroke-[2.5]" />}
                </span>
                <span
                  className={`text-sm font-medium ${
                    task.completed ? 'line-through text-[#94A3B8]' : 'text-white'
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <span className="text-xs text-[#94A3B8] shrink-0 hidden sm:inline">
                {task.tag}
              </span>
            </button>
          ))}
        </div>

        {completedCount === tasks.length && tasks.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#FFB020]/15 border border-[#FFB020]/40 flex items-center gap-2.5 text-xs text-[#ffddb1]">
            <Sparkles className="w-4 h-4 text-[#FFB020] shrink-0" />
            <span>
              All daily mission targets complete, {profile.name}! That’s how top ranks are built—one undefeated day at a time.
            </span>
          </div>
        )}
      </div>

      {/* Full-Screen "Remind Me Why I Started" Overlay Modal */}
      {whyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="why-i-started-heading"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#090d1e]/95 backdrop-blur-xl transition-opacity duration-200"
        >
          <div className="w-full max-w-2xl orbital-glass-gold rounded-3xl p-6 sm:p-10 relative shadow-[0_0_60px_rgba(255,176,32,0.22)]">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 text-xs font-display font-bold tracking-wider text-[#FFB020] uppercase">
                <Flag className="w-4 h-4" />
                <span>North Star Transmission · For {profile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setWhyModalOpen(false)}
                aria-label="Close reminder overlay"
                className="min-h-[44px] min-w-[44px] rounded-full bg-[#131938] hover:bg-[#1e264f] border border-[#2A3362] text-[#CBD5E1] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2
              id="why-i-started-heading"
              className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mb-4"
            >
              “{profile.goal}”
            </h2>

            {whyLoading && !whyMessage && (
              <div className="py-8 flex items-center gap-3 text-sm text-[#FFB020]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFB020] animate-ping" />
                <span>Connecting to Mission Mentor for your personal reminder...</span>
              </div>
            )}

            {whyError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-[#93000a]/40 border border-[#ffb4ab]/40 text-sm text-[#ffdad6]"
              >
                {whyError}
              </div>
            )}

            {whyMessage && (
              <div className="prose prose-invert max-w-none space-y-4 text-base sm:text-lg text-[#dee1fa] leading-relaxed whitespace-pre-line">
                {whyMessage}
              </div>
            )}

            <div className="mt-8 pt-5 border-t border-[#2A3362] flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-[#94A3B8]">
                Target: JEE {profile.examYear} · Conquering {strugglesLabel}
              </span>
              <button
                type="button"
                onClick={() => setWhyModalOpen(false)}
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FFB020] to-[#F59E0B] text-[#0A0E1F] font-display font-bold text-xs cursor-pointer"
              >
                Back to Mission Control
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
