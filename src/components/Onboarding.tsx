import React, { useState } from 'react';
import {
  Rocket,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Target,
  ShieldAlert,
  Calendar,
  GraduationCap,
  Check,
  Clock,
  Layers,
  Dumbbell,
  BookOpenCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  MonthTiming,
  StudentClass,
  StruggleType,
  UserProfile,
  formatStrugglesList,
} from '../utils/lakshyaLogic';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
}

const GOAL_EXAMPLES = [
  'AIR under 500 in JEE Advanced — IIT Bombay CSE',
  '99.5+ Percentile in JEE Main Session 1',
  'Crack IIT Delhi Electrical / Mathematics & Computing',
  'Clear all PCM backlogs & score 220+ in JEE Main',
];

const CLASS_OPTIONS: StudentClass[] = [
  'Class 11',
  'Class 12',
  'Dropper / Repeater',
  'Foundation (9/10)',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SYLLABUS_YEARS = ['2026', '2027', '2028', '2029'];
const EXAM_YEARS = ['2026', '2027', '2028', '2029'];
const TIMING_OPTIONS: MonthTiming[] = [
  'Starting of the month',
  'End of the month',
];

const STRUGGLE_OPTIONS: { id: StruggleType; label: string; desc: string }[] = [
  { id: 'Focus', label: 'Focus', desc: 'Getting distracted mid-session' },
  { id: 'Stress', label: 'Stress', desc: 'Mock test anxiety & overthinking' },
  { id: 'Consistency', label: 'Consistency', desc: 'Strong starts, broken streaks' },
  { id: 'Backlog', label: 'Backlog', desc: 'Piled-up chapters & lecture debt' },
];

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  initialProfile,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState(initialProfile?.name || '');
  const [goal, setGoal] = useState(initialProfile?.goal || '');
  const [studentClass, setStudentClass] = useState<StudentClass>(
    initialProfile?.studentClass || 'Class 12'
  );

  // Step 3: Backlog & Syllabus Completion Target
  const [hasBacklog, setHasBacklog] = useState<boolean>(
    initialProfile?.hasBacklog ?? false
  );
  const [pendingChapters, setPendingChapters] = useState<number>(
    initialProfile?.pendingChapters || 8
  );
  const [syllabusMonth, setSyllabusMonth] = useState<string>(
    initialProfile?.syllabusTarget?.month || 'December'
  );
  const [syllabusYear, setSyllabusYear] = useState<string>(
    initialProfile?.syllabusTarget?.year || '2026'
  );
  const [syllabusTiming, setSyllabusTiming] = useState<MonthTiming>(
    initialProfile?.syllabusTarget?.timing || 'End of the month'
  );

  // Step 3: Study Hours (Current vs Target) & Workout Hours (1h or 2h)
  const [currentStudyHours, setCurrentStudyHours] = useState<number>(
    initialProfile?.currentStudyHours || 4
  );
  const [targetStudyHours, setTargetStudyHours] = useState<number>(
    initialProfile?.targetStudyHours || 9
  );
  const [workoutHours, setWorkoutHours] = useState<1 | 2>(
    initialProfile?.workoutHours || 1
  );
  const [workoutOverLimitMsg, setWorkoutOverLimitMsg] = useState<string>('');

  // Step 4: Exam Year & Multi-Select Struggles
  const [examYear, setExamYear] = useState(initialProfile?.examYear || '2027');
  const [selectedStruggles, setSelectedStruggles] = useState<StruggleType[]>(
    initialProfile?.struggles && initialProfile.struggles.length > 0
      ? initialProfile.struggles
      : ['Consistency']
  );
  const [error, setError] = useState('');

  const toggleStruggle = (id: StruggleType) => {
    setSelectedStruggles((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
    if (error) setError('');
  };

  const handleSelectBacklog = (value: boolean) => {
    setHasBacklog(value);
    if (value && !selectedStruggles.includes('Backlog')) {
      setSelectedStruggles((prev) => [...prev, 'Backlog']);
    }
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tell me your name first so I know who I am cheering for!');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      setError('Write down your target or tap one of the example goals below.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleNextStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep(4);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStruggles.length === 0) {
      setError(
        'Please check at least 1 struggle so we can personalize your guidance.'
      );
      return;
    }
    const nowIso = new Date().toISOString();
    const newProfile: UserProfile = {
      name: name.trim(),
      goal: goal.trim(),
      studentClass,
      hasBacklog,
      pendingChapters: hasBacklog ? Math.max(1, pendingChapters) : 0,
      syllabusTarget: {
        month: syllabusMonth,
        year: syllabusYear,
        timing: syllabusTiming,
      },
      currentStudyHours: Math.max(1, currentStudyHours),
      targetStudyHours: Math.max(1, targetStudyHours),
      workoutHours,
      weightKg: initialProfile?.weightKg || 62,
      heightCm: initialProfile?.heightCm || 172,
      bodyGoal: initialProfile?.bodyGoal || 'Lean & Athletic',
      restDays: initialProfile?.restDays || [],
      foodLog: initialProfile?.foodLog || [],
      skills: initialProfile?.skills || [
        {
          id: 'skill-default-1',
          name: 'Python & AI Fundamentals',
          category: 'Coding & AI',
          sessionsCompleted: 1,
          createdAt: nowIso,
        },
      ],
      examYear: examYear || '2027',
      struggles: selectedStruggles,
      struggle: formatStrugglesList(selectedStruggles),
      streak: initialProfile?.streak || 1,
      lastVisit: nowIso,
      createdAt: initialProfile?.createdAt || nowIso,
      roadmapStage: initialProfile?.roadmapStage || 'foundation',
      stageProgress: initialProfile?.stageProgress || {
        foundation: [false, false, false],
        practice: [false, false, false],
        mocks: [false, false, false],
        sprint: [false, false, false],
        jeeday: [false, false, false],
      },
    };
    onComplete(newProfile);
  };

  // Widen the container in Step 3 when "Do you have Backlogs?" is clicked!
  const containerWidthClass =
    step === 3 && hasBacklog
      ? 'max-w-3xl'
      : step === 3
      ? 'max-w-2xl'
      : 'max-w-xl';

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div
        className={`w-full ${containerWidthClass} orbital-glass-2 rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(124,92,255,0.16)] relative overflow-hidden transition-all duration-300`}
      >
        {/* Top ambient glow */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#7C5CFF]/15 blur-3xl pointer-events-none"
        />

        {/* Header & Step Progress */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#22D3EE] flex items-center justify-center text-[#0A0E1F] font-bold">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold tracking-wider text-white text-base block leading-none">
                LAKSHYA
              </span>
              <span className="text-xs text-[#94A3B8]">
                JEE / IIT Orbital Companion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2" aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map((s) => (
              <span
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-gradient-to-r from-[#7C5CFF] to-[#22D3EE]'
                    : s < step
                    ? 'w-3 bg-[#22D3EE]/60'
                    : 'w-3 bg-[#2A3362]'
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          {/* STEP 1: NAME */}
          {step === 1 && (
            <form
              key="step1"
              onSubmit={handleNextStep1}
              className="space-y-6 transition-opacity duration-200"
            >
              <div className="space-y-2">
                <p className="text-xs font-display font-semibold tracking-wider text-[#22D3EE] uppercase">
                  Step 01 · Flight Check-In
                </p>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                  Hey champ, welcome aboard. What should I call you?
                </h1>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  Think of LAKSHYA as your older brother or sister who’s been through the JEE trenches—here to calm your nerves, pick your next study move, guide your workouts &amp; skills, and guard your big dream.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="onboarding-name-input"
                  className="block text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider"
                >
                  Your First Name or Nickname
                </label>
                <input
                  id="onboarding-name-input"
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g., Aarav, Priya, Rohan..."
                  className="w-full h-12 px-4 rounded-xl bg-[#0A0E1F]/80 border border-[#2A3362] focus:border-[#7C5CFF] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/25 text-white placeholder-[#64748B] text-base transition-all"
                />
                {error && (
                  <p role="alert" className="text-xs text-[#ffb4ab] font-medium">
                    {error}
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="min-h-[48px] px-7 py-3 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#633BF3] hover:shadow-[0_0_24px_rgba(124,92,255,0.45)] text-white font-display font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: MAIN GOAL */}
          {step === 2 && (
            <form
              key="step2"
              onSubmit={handleNextStep2}
              className="space-y-6 transition-opacity duration-200"
            >
              <div className="space-y-2">
                <p className="text-xs font-display font-semibold tracking-wider text-[#FFB020] uppercase">
                  Step 02 · Your North Star
                </p>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                  Nice to meet you, {name}. What is your main goal?
                </h1>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  Be specific—college, branch, rank, or the comeback you are fighting for. Every AI mentor will use this to keep your eyes on the prize.
                </p>
              </div>

              <div className="space-y-3">
                <label
                  htmlFor="onboarding-goal-textarea"
                  className="block text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider"
                >
                  Your Main JEE / IIT Mission
                </label>
                <textarea
                  id="onboarding-goal-textarea"
                  rows={3}
                  autoFocus
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Write your dream rank, IIT/NIT campus, or target percentile..."
                  className="w-full p-4 rounded-xl bg-[#0A0E1F]/80 border border-[#2A3362] focus:border-[#7C5CFF] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/25 text-white placeholder-[#64748B] text-sm leading-relaxed transition-all resize-none"
                />
                {error && (
                  <p role="alert" className="text-xs text-[#ffb4ab] font-medium">
                    {error}
                  </p>
                )}

                <div className="space-y-2 pt-1">
                  <span className="text-xs text-[#94A3B8] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFB020]" />
                    <span>Or tap an example to customize:</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => {
                          setGoal(ex);
                          setError('');
                        }}
                        className={`text-left text-xs px-3.5 py-2 rounded-full border transition-all cursor-pointer ${
                          goal === ex
                            ? 'bg-[#7C5CFF]/20 border-[#7C5CFF] text-white font-medium'
                            : 'bg-[#131938]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#7C5CFF]/50'
                        }`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] px-4 py-2 rounded-full border border-[#2A3362] text-[#CBD5E1] hover:text-white text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] px-7 py-3 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#633BF3] hover:shadow-[0_0_24px_rgba(124,92,255,0.45)] text-white font-display font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CLASS, DO YOU HAVE BACKLOGS (WIDENS SPACE), STUDY HOURS (+30M AUTO-BOOST) & WORKOUT HOURS */}
          {step === 3 && (
            <form
              key="step3"
              onSubmit={handleNextStep3}
              className="space-y-6 transition-opacity duration-200"
            >
              <div className="space-y-2">
                <p className="text-xs font-display font-semibold tracking-wider text-[#22D3EE] uppercase">
                  Step 03 · Class, Backlogs, Study &amp; Workout Hours
                </p>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                  Let’s calibrate your daily study engine, {name}.
                </h1>
                <p className="text-sm text-[#CBD5E1]">
                  Tell us your class, whether you have backlogs, your current vs. dream study hours, and your daily workout slot.
                </p>
              </div>

              {/* 1. Which Class */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-[#22D3EE]" />
                  <span>Which Class Are You Currently In?</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CLASS_OPTIONS.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setStudentClass(cls)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl font-display font-bold text-xs border transition-all cursor-pointer ${
                        studentClass === cls
                          ? 'bg-[#22D3EE]/18 border-[#22D3EE] text-[#22D3EE] shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                          : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#22D3EE]/40'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Do you have Backlogs? (Widens space when clicked!) */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-[#FFB020]" />
                  <span>Do You Have Backlogs?</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    data-testid="backlog-yes-btn"
                    onClick={() => handleSelectBacklog(true)}
                    className={`min-h-[48px] px-4 py-3 rounded-xl font-display font-bold text-xs sm:text-sm border flex items-center justify-between transition-all cursor-pointer ${
                      hasBacklog
                        ? 'bg-[#FFB020]/20 border-[#FFB020] text-[#FFB020] shadow-[0_0_20px_rgba(255,176,32,0.25)]'
                        : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#FFB020]/40'
                    }`}
                  >
                    <span>Yes, I have Backlogs (Focus on Syllabus)</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        hasBacklog
                          ? 'bg-[#FFB020] border-[#FFB020] text-[#0A0E1F]'
                          : 'border-[#2A3362]'
                      }`}
                    >
                      {hasBacklog && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="backlog-no-btn"
                    onClick={() => handleSelectBacklog(false)}
                    className={`min-h-[48px] px-4 py-3 rounded-xl font-display font-bold text-xs sm:text-sm border flex items-center justify-between transition-all cursor-pointer ${
                      !hasBacklog
                        ? 'bg-[#22D3EE]/18 border-[#22D3EE] text-[#22D3EE] shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                        : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#22D3EE]/40'
                    }`}
                  >
                    <span>No Backlogs (Normal Tests &amp; Practice)</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        !hasBacklog
                          ? 'bg-[#22D3EE] border-[#22D3EE] text-[#0A0E1F]'
                          : 'border-[#2A3362]'
                      }`}
                    >
                      {!hasBacklog && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                </div>

                {/* Expanded Wide Backlog Panel when hasBacklog === true */}
                {hasBacklog ? (
                  <div
                    data-testid="backlog-expanded-panel"
                    className="rounded-2xl bg-[#0A0E1F]/90 border border-[#FFB020]/60 p-5 space-y-4 shadow-[0_0_28px_rgba(255,176,32,0.14)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A3362] pb-3">
                      <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#FFB020]">
                        <Sparkles className="w-4 h-4" />
                        <span>Full-System Syllabus &amp; Backlog Clearance Mode Active</span>
                      </div>
                      <span className="text-[11px] text-[#CBD5E1]">
                        All AI coaches &amp; missions will prioritize your syllabus completion
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="pending-chapters-input"
                          className="block text-[11px] text-[#94A3B8] mb-1 font-display uppercase tracking-wider"
                        >
                          How Many Chapters Pending?
                        </label>
                        <input
                          id="pending-chapters-input"
                          type="number"
                          min={1}
                          max={90}
                          value={pendingChapters}
                          onChange={(e) =>
                            setPendingChapters(
                              Math.max(1, parseInt(e.target.value, 10) || 1)
                            )
                          }
                          className="w-full h-11 px-3.5 rounded-xl bg-[#131938] border border-[#FFB020]/50 focus:border-[#FFB020] focus:outline-none text-sm text-white font-mono-num font-bold"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="syllabus-year-select"
                          className="block text-[11px] text-[#94A3B8] mb-1 font-display uppercase tracking-wider"
                        >
                          Syllabus Target Year
                        </label>
                        <select
                          id="syllabus-year-select"
                          value={syllabusYear}
                          onChange={(e) => setSyllabusYear(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl bg-[#131938] border border-[#2A3362] focus:border-[#FFB020] focus:outline-none text-sm text-white font-display font-semibold"
                        >
                          {SYLLABUS_YEARS.map((yr) => (
                            <option
                              key={yr}
                              value={yr}
                              className="bg-[#0A0E1F] text-white"
                            >
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="syllabus-month-select"
                          className="block text-[11px] text-[#94A3B8] mb-1 font-display uppercase tracking-wider"
                        >
                          Syllabus Target Month
                        </label>
                        <select
                          id="syllabus-month-select"
                          value={syllabusMonth}
                          onChange={(e) => setSyllabusMonth(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl bg-[#131938] border border-[#2A3362] focus:border-[#FFB020] focus:outline-none text-sm text-white font-display font-semibold"
                        >
                          {MONTHS.map((m) => (
                            <option
                              key={m}
                              value={m}
                              className="bg-[#0A0E1F] text-white"
                            >
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Two options next to that: Starting of the month OR End of the month */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {TIMING_OPTIONS.map((timing) => {
                        const active = syllabusTiming === timing;
                        return (
                          <button
                            key={timing}
                            type="button"
                            onClick={() => setSyllabusTiming(timing)}
                            className={`min-h-[44px] px-4 py-2.5 rounded-xl font-display font-bold text-xs border flex items-center justify-between transition-all cursor-pointer ${
                              active
                                ? 'bg-[#FFB020]/20 border-[#FFB020] text-[#FFB020]'
                                : 'bg-[#131938]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#FFB020]/40'
                            }`}
                          >
                            <span>{timing}</span>
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                active
                                  ? 'bg-[#FFB020] border-[#FFB020] text-[#0A0E1F]'
                                  : 'border-[#2A3362]'
                              }`}
                            >
                              {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Compact syllabus target selector when no backlog */
                  <div className="rounded-2xl bg-[#0A0E1F]/65 border border-[#2A3362] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-display font-semibold text-[#CBD5E1]">
                      <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>When do you want to finish your syllabus?</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        id="syllabus-year-select"
                        aria-label="Target Year"
                        value={syllabusYear}
                        onChange={(e) => setSyllabusYear(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#0A0E1F] border border-[#2A3362] text-xs text-white font-display font-semibold"
                      >
                        {SYLLABUS_YEARS.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                      <select
                        id="syllabus-month-select"
                        aria-label="Target Month"
                        value={syllabusMonth}
                        onChange={(e) => setSyllabusMonth(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#0A0E1F] border border-[#2A3362] text-xs text-white font-display font-semibold"
                      >
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {TIMING_OPTIONS.map((timing) => {
                        const active = syllabusTiming === timing;
                        return (
                          <button
                            key={timing}
                            type="button"
                            onClick={() => setSyllabusTiming(timing)}
                            className={`min-h-[40px] px-3 py-2 rounded-xl font-display font-bold text-xs border flex items-center justify-between cursor-pointer ${
                              active
                                ? 'bg-[#FFB020]/20 border-[#FFB020] text-[#FFB020]'
                                : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                            }`}
                          >
                            <span>{timing}</span>
                            {active && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. How many hours you CAN study vs WANT to study (+30 min daily auto-increase) */}
              <div className="rounded-2xl bg-[#0A0E1F]/75 border border-[#2A3362] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-display font-semibold text-[#cabeff] uppercase tracking-wider">
                  <BookOpenCheck className="w-4 h-4 text-[#7C5CFF]" />
                  <span>Daily Study Hours Calibration</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="current-study-hours-input"
                      className="block text-xs text-[#CBD5E1] mb-1"
                    >
                      How many hours <strong>can you</strong> study daily right now?
                    </label>
                    <input
                      id="current-study-hours-input"
                      type="number"
                      min={1}
                      max={16}
                      value={currentStudyHours}
                      onChange={(e) =>
                        setCurrentStudyHours(
                          Math.max(1, Math.min(16, Number(e.target.value) || 1))
                        )
                      }
                      className="w-full h-11 px-3.5 rounded-xl bg-[#131938] border border-[#2A3362] focus:border-[#7C5CFF] focus:outline-none text-sm text-white font-mono-num font-bold"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="target-study-hours-input"
                      className="block text-xs text-[#CBD5E1] mb-1"
                    >
                      How many hours <strong>do you want</strong> to study daily?
                    </label>
                    <input
                      id="target-study-hours-input"
                      type="number"
                      min={1}
                      max={16}
                      value={targetStudyHours}
                      onChange={(e) =>
                        setTargetStudyHours(
                          Math.max(1, Math.min(16, Number(e.target.value) || 1))
                        )
                      }
                      className="w-full h-11 px-3.5 rounded-xl bg-[#131938] border border-[#2A3362] focus:border-[#7C5CFF] focus:outline-none text-sm text-white font-mono-num font-bold"
                    />
                  </div>
                </div>

                {currentStudyHours < targetStudyHours && (
                  <div className="p-3 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/40 text-xs text-[#dee1fa] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#22D3EE] shrink-0" />
                    <span>
                      <strong>+30 Min Daily Step-Up Active:</strong> Since you currently study{' '}
                      <strong>{currentStudyHours}h</strong> and want to reach{' '}
                      <strong>{targetStudyHours}h</strong>, your dashboard will automatically boost your target by{' '}
                      <strong>+30 mins extra each day</strong> (starting at{' '}
                      <strong>{currentStudyHours} hrs 30 min</strong> today)!
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Workout Hours: ONLY 1 Hour or 2 Hours (if >2 hrs clicked, warn "NEED time to study!") */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
                  <Dumbbell className="w-4 h-4 text-[#22D3EE]" />
                  <span>How Many Hours Do You Want to Do Workout Daily?</span>
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkoutHours(1);
                      setWorkoutOverLimitMsg('');
                    }}
                    className={`min-h-[46px] px-3 py-2 rounded-xl font-display font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                      workoutHours === 1
                        ? 'bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE]'
                        : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                    }`}
                  >
                    1 Hour
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWorkoutHours(2);
                      setWorkoutOverLimitMsg('');
                    }}
                    className={`min-h-[46px] px-3 py-2 rounded-xl font-display font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                      workoutHours === 2
                        ? 'bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE]'
                        : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                    }`}
                  >
                    2 Hours
                  </button>

                  <button
                    type="button"
                    data-testid="workout-more-than-2h-btn"
                    onClick={() =>
                      setWorkoutOverLimitMsg(
                        'Hey! You NEED time to study for JEE! Workout is capped at 1 or 2 hours maximum.'
                      )
                    }
                    className="min-h-[46px] px-3 py-2 rounded-xl font-display font-semibold text-xs border bg-[#0A0E1F]/50 border-[#2A3362] text-[#94A3B8] hover:border-[#ffb4ab]/60 hover:text-[#ffb4ab] transition-all cursor-pointer"
                  >
                    More than 2 Hours?
                  </button>
                </div>

                {workoutOverLimitMsg && (
                  <div
                    role="alert"
                    data-testid="workout-over-limit-alert"
                    className="p-3 rounded-xl bg-[#93000a]/40 border border-[#ffb4ab]/50 text-xs text-[#ffdad6] flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#ffb4ab] shrink-0" />
                    <span>{workoutOverLimitMsg}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-4 py-2 rounded-full border border-[#2A3362] text-[#CBD5E1] hover:text-white text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] px-7 py-3 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#633BF3] hover:shadow-[0_0_24px_rgba(124,92,255,0.45)] text-white font-display font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: JEE MAINS & ADVANCED EXAM YEAR + MULTI-SELECT STRUGGLE CHECKBOXES */}
          {step === 4 && (
            <form
              key="step4"
              onSubmit={handleFinish}
              className="space-y-6 transition-opacity duration-200"
            >
              <div className="space-y-2">
                <p className="text-xs font-display font-semibold tracking-wider text-[#FFB020] uppercase">
                  Step 04 · Exam Year &amp; Hurdles
                </p>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                  Which year are you going to write JEE Mains &amp; Advanced?
                </h1>
                <p className="text-sm text-[#CBD5E1]">
                  Pick your exam year and check all the struggles you want help overcoming (you can select more than 1).
                </p>
              </div>

              {/* JEE Mains & Advanced Exam Year */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>JEE Mains &amp; Advanced Exam Year</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {EXAM_YEARS.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setExamYear(yr)}
                      className={`min-h-[48px] rounded-xl font-display font-bold text-sm border transition-all cursor-pointer ${
                        examYear === yr
                          ? 'bg-[#22D3EE]/18 border-[#22D3EE] text-[#22D3EE] shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                          : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#22D3EE]/40'
                      }`}
                    >
                      JEE {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Select Biggest Struggle Checkboxes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#FFB020]" />
                    <span>Biggest Struggles (Select 1 or More)</span>
                  </label>
                  <span className="text-xs font-mono-num text-[#cabeff]">
                    {selectedStruggles.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STRUGGLE_OPTIONS.map((item) => {
                    const checked = selectedStruggles.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggleStruggle(item.id)}
                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          checked
                            ? 'bg-[#7C5CFF]/22 border-[#7C5CFF] shadow-[0_0_18px_rgba(124,92,255,0.2)]'
                            : 'bg-[#0A0E1F]/70 border-[#2A3362] hover:border-[#7C5CFF]/40'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                            checked
                              ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white'
                              : 'bg-[#131938] border-[#2A3362]'
                          }`}
                        >
                          {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <div>
                          <div className="font-display font-semibold text-sm text-white">
                            {item.label}
                          </div>
                          <div className="text-xs text-[#94A3B8] mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <p role="alert" className="text-xs text-[#ffb4ab] font-medium">
                    {error}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="min-h-[44px] px-4 py-2 rounded-full border border-[#2A3362] text-[#CBD5E1] hover:text-white text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] px-7 py-3 rounded-full bg-gradient-to-r from-[#FFB020] to-[#F59E0B] hover:shadow-[0_0_24px_rgba(255,176,32,0.45)] text-[#0A0E1F] font-display font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Target className="w-4 h-4" />
                  <span>Launch Mission Control</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};
