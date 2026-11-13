import React, { useEffect, useState } from 'react';
import {
  Flame,
  Calendar,
  Target,
  Wind,
  Zap,
  Compass,
  Edit3,
  Quote,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Heart,
  Dumbbell,
  Code2,
  Layers,
  BookOpenCheck,
} from 'lucide-react';
import {
  CompanionId,
  DailyQuote,
  MoodId,
  UserProfile,
  buildCompanionSystemPrompt,
  calculateDailyStudyPlan,
  calculateDaysToExam,
  formatStrugglesList,
  formatSyllabusTarget,
  toLocalDateKey,
} from '../utils/lakshyaLogic';
import { callGrok } from '../api/grok';

interface HomeProps {
  profile: UserProfile;
  onSelectCompanion: (companion: CompanionId) => void;
  onOpenEditProfile: () => void;
  onSelectMood: (mood: MoodId) => void;
}

const QUOTE_STORAGE_KEY = 'lakshya_daily_quote';

const MOOD_OPTIONS: {
  id: MoodId;
  label: string;
  desc: string;
  suggestedAi: CompanionId;
  feedback: string;
}[] = [
  {
    id: 'locked-in',
    label: 'Locked In',
    desc: 'High energy & ready to attack problems',
    suggestedAi: 'now',
    feedback:
      'Love that energy! Jump into NOW and put that high battery on a tough problem set before distractions creep in.',
  },
  {
    id: 'steady',
    label: 'Steady',
    desc: 'Calm & consistent, ready for daily targets',
    suggestedAi: 'mission',
    feedback:
      'Steady beats flashy every single day. Check off your 3 daily targets in MISSION.',
  },
  {
    id: 'tired',
    label: 'Low Battery',
    desc: 'Drained after lectures or long hours',
    suggestedAi: 'now',
    feedback:
      'Don’t force heavy derivations when tired. Let NOW pick a 15-minute formula or PYQ review for you.',
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    desc: 'Anxious about syllabus, marks, or rank',
    suggestedAi: 'calm',
    feedback:
      'Take your foot off the gas for 3 minutes. Head to CALM for a breathing reset first—the books can wait.',
  },
];

export const Home: React.FC<HomeProps> = ({
  profile,
  onSelectCompanion,
  onOpenEditProfile,
  onSelectMood,
}) => {
  const countdown = calculateDaysToExam(profile.examYear);
  const studyPlan = calculateDailyStudyPlan(profile);
  const todayKey = toLocalDateKey(new Date());

  const [dailyQuote, setDailyQuote] = useState<DailyQuote>(() => {
    try {
      const saved = localStorage.getItem(QUOTE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DailyQuote;
        if (parsed.date === todayKey && parsed.goalSnapshot === profile.goal) {
          return parsed;
        }
      }
    } catch {
      // ignore storage error
    }
    return {
      date: todayKey,
      quote: `Every complex JEE problem you wrestle with today is quietly carving your seat for ${profile.goal}. Don't rush the struggle—let it sharpen you.`,
      context: `Daily Directive · JEE ${profile.examYear}`,
      goalSnapshot: profile.goal,
    };
  });

  const [quoteLoading, setQuoteLoading] = useState(false);

  const fetchFreshDailyQuote = async (force: boolean = false) => {
    if (!force) {
      try {
        const saved = localStorage.getItem(QUOTE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as DailyQuote;
          if (parsed.date === todayKey && parsed.goalSnapshot === profile.goal) {
            return;
          }
        }
      } catch {
        // continue
      }
    }

    setQuoteLoading(true);
    try {
      const res = await callGrok({
        companion: 'mission',
        profile,
        purpose: 'quote',
        systemPrompt: buildCompanionSystemPrompt('mission', profile),
        messages: [
          {
            role: 'user',
            content: `Write a 1-2 sentence original, non-cliché daily motivation quote specifically for ${profile.name} whose JEE ${profile.examYear} goal is "${profile.goal}" and biggest struggle is "${profile.struggle}". Return plain text or JSON {"quote": "...", "context": "..."}.`,
          },
        ],
        stream: false,
      });

      let quoteText = res.reply;
      let contextText = `Tailored for ${profile.name} · Target JEE ${profile.examYear}`;
      try {
        const parsed = JSON.parse(res.reply);
        if (parsed.quote) quoteText = parsed.quote;
        if (parsed.context) contextText = parsed.context;
      } catch {
        quoteText = res.reply.replace(/^["']|["']$/g, '');
      }

      const updated: DailyQuote = {
        date: todayKey,
        quote: quoteText,
        context: contextText,
        goalSnapshot: profile.goal,
      };
      setDailyQuote(updated);
      localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Keep existing fallback quote silently
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchFreshDailyQuote(false);
  }, [profile.goal, todayKey]);

  const activeMoodObj = MOOD_OPTIONS.find((m) => m.id === profile.lastMood);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Greeting & Edit Profile Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-display font-semibold tracking-wider text-[#22D3EE] uppercase">
            <span>Orbital Command Deck</span>
            <span aria-hidden="true">·</span>
            <span>JEE {profile.examYear} Campaign</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Hey {profile.name}, ready for today’s climb?
          </h1>
          <p className="text-sm text-[#CBD5E1]">
            Forget yesterday’s noise. Let’s put down one honest study block at a time.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenEditProfile}
          className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#131938]/90 hover:bg-[#1d2552] border border-[#2A3362] hover:border-[#7C5CFF]/60 text-xs font-display font-semibold text-white flex items-center gap-2 self-start sm:self-center transition-all cursor-pointer whitespace-nowrap"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#22D3EE]" />
          <span>Edit profile</span>
        </button>
      </div>

      {/* Hero Row: Pinned Goal Card + Telemetry (Countdown & Streak) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Pinned North Star Goal Card */}
        <div className="lg:col-span-7 orbital-glass-gold rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#FFB020]/15 blur-3xl pointer-events-none"
          />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#FFB020]">
                <Target className="w-4 h-4" />
                <span>Pinned North Star Goal</span>
              </div>
              <span className="text-xs text-[#94A3B8]">
                Hurdles:{' '}
                <strong className="text-white">
                  {formatStrugglesList(profile.struggles, profile.struggle)}
                </strong>
              </span>
            </div>

            <h2
              data-testid="pinned-goal-text"
              className="text-xl sm:text-2xl font-display font-bold text-white leading-snug"
            >
              “{profile.goal}”
            </h2>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#CBD5E1]">
              {profile.studentClass && (
                <span className="px-2.5 py-1 rounded-lg bg-[#0A0E1F]/70 border border-[#2A3362] text-[#22D3EE] font-display font-semibold">
                  {profile.studentClass}
                </span>
              )}
              {profile.hasBacklog ? (
                <span
                  data-testid="home-backlog-mode-badge"
                  className="px-2.5 py-1 rounded-lg bg-[#FFB020]/20 border border-[#FFB020] text-[#FFB020] font-display font-bold flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    Backlog Focus: {profile.pendingChapters || 8} Chapters Pending ·{' '}
                    {formatSyllabusTarget(profile.syllabusTarget)}
                  </span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-[#0A0E1F]/70 border border-[#2A3362] text-[#CBD5E1]">
                  Syllabus Target:{' '}
                  <strong className="text-white">
                    {formatSyllabusTarget(profile.syllabusTarget)}
                  </strong>{' '}
                  (No Backlogs)
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg bg-[#0A0E1F]/70 border border-[#2A3362] text-[#FFB020] font-mono-num font-semibold">
                JEE {profile.examYear}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#2A3362]/80 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#CBD5E1]">
              Stage:{' '}
              <strong className="text-[#FFB020] uppercase font-display tracking-wider">
                {profile.roadmapStage || 'foundation'}
              </strong>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenEditProfile}
                className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#0A0E1F]/70 hover:bg-[#0A0E1F] border border-[#2A3362] text-xs font-display font-semibold text-[#CBD5E1] transition-colors cursor-pointer"
              >
                Change Goal
              </button>
              <button
                type="button"
                onClick={() => onSelectCompanion('mission')}
                className="min-h-[40px] px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFB020] to-[#F59E0B] text-[#0A0E1F] text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Open Mission</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Countdown, Daily Study Target (+30m extra) & Streak Telemetry Slabs */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3.5">
          {/* Days to Exam Countdown */}
          <div className="orbital-glass-cyan rounded-3xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-display font-semibold uppercase tracking-wider text-[#22D3EE]">
              <span>Countdown</span>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="my-2.5">
              <div
                data-testid="days-to-exam-value"
                className="text-2xl sm:text-3xl font-display font-bold font-mono-num text-white"
              >
                {countdown.daysRemaining}
              </div>
              <div className="text-xs text-[#CBD5E1] font-medium mt-0.5">
                Days Left
              </div>
            </div>
            <div className="text-[11px] text-[#94A3B8] border-t border-[#2A3362]/70 pt-2 truncate">
              {countdown.targetLabel}
            </div>
          </div>

          {/* Daily Stepped-Up Study Timing (+30 min daily boost) */}
          <div
            data-testid="daily-study-target-card"
            className="orbital-glass-2 rounded-3xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[11px] font-display font-semibold uppercase tracking-wider text-[#cabeff]">
              <span>Study Target</span>
              <BookOpenCheck className="w-4 h-4 text-[#7C5CFF]" />
            </div>
            <div className="my-2.5">
              <div
                data-testid="daily-study-target-value"
                className="text-xl sm:text-2xl font-display font-bold font-mono-num text-white"
              >
                {studyPlan.formattedTodayTarget}
              </div>
              <div className="text-[11px] text-[#22D3EE] font-semibold mt-0.5">
                {studyPlan.isSteppedUp
                  ? `+30m daily boost (${studyPlan.currentHours}h → ${studyPlan.targetHours}h)`
                  : `Target ${studyPlan.targetHours}h/day`}
              </div>
            </div>
            <div className="text-[11px] text-[#94A3B8] border-t border-[#2A3362]/70 pt-2 truncate">
              Workout: {profile.workoutHours || 1}h/day
            </div>
          </div>

          {/* Daily Streak Counter */}
          <div className="orbital-glass-1 rounded-3xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-display font-semibold uppercase tracking-wider text-[#FFB020]">
              <span>Streak</span>
              <Flame className="w-4 h-4 text-[#FFB020] fill-current" />
            </div>
            <div className="my-2.5">
              <div
                data-testid="streak-counter-value"
                className="text-2xl sm:text-3xl font-display font-bold font-mono-num text-white"
              >
                {profile.streak} {profile.streak === 1 ? 'Day' : 'Days'}
              </div>
              <div className="text-xs text-[#CBD5E1] font-medium mt-0.5">
                Study Streak
              </div>
            </div>
            <div className="text-[11px] text-[#94A3B8] border-t border-[#2A3362]/70 pt-2">
              Show up daily
            </div>
          </div>
        </div>
      </div>

      {/* AI Companion Cards: Calm, Now, Motivation, Mission */}
      <section aria-labelledby="ai-companions-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="ai-companions-heading"
            className="text-lg font-display font-bold text-white tracking-tight"
          >
            Your AI Mentors &amp; Companions
          </h2>
          <span className="text-xs text-[#94A3B8]">
            Personalized to your profile &amp; recent chats
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. CALM (Teal / Cyan) */}
          <button
            type="button"
            onClick={() => onSelectCompanion('calm')}
            className="orbital-glass-cyan rounded-3xl p-6 text-left flex flex-col justify-between group hover:border-[#22D3EE] hover:shadow-[0_0_32px_rgba(34,211,238,0.2)] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#22D3EE]/15 border border-[#22D3EE]/40 flex items-center justify-center text-[#22D3EE]">
                  <Wind className="w-6 h-6" />
                </div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#22D3EE]">
                  Stress Relief AI
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-[#22D3EE] transition-colors">
                  Calm
                </h3>
                <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1.5 leading-relaxed">
                  Anxious about mocks, feeling behind, or missing home? Validate your feelings and do a 5-minute nervous system reset.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2A3362]/70 flex items-center justify-between text-xs font-display font-bold text-[#22D3EE]">
              <span>Breathe &amp; Reset</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 2. NOW (Electric Violet) */}
          <button
            type="button"
            onClick={() => onSelectCompanion('now')}
            className="orbital-glass-2 rounded-3xl p-6 text-left flex flex-col justify-between group hover:border-[#7C5CFF] hover:shadow-[0_0_32px_rgba(124,92,255,0.25)] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/50 flex items-center justify-center text-[#cabeff]">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#cabeff]">
                  Decisive Study Coach
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-[#cabeff] transition-colors">
                  Now
                </h3>
                <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1.5 leading-relaxed">
                  Stuck deciding what to study? Give your time and energy level—get ONE clear action, start a timer, or switch to Motivation inside.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2A3362]/70 flex items-center justify-between text-xs font-display font-bold text-[#cabeff]">
              <span>Get Next Action</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 3. MOTIVATION (Lovely Friendly Chatbot — Rose / Pink) */}
          <button
            type="button"
            onClick={() => onSelectCompanion('motivation')}
            className="orbital-glass-rose rounded-3xl p-6 text-left flex flex-col justify-between group hover:border-[#F472B6] hover:shadow-[0_0_32px_rgba(244,114,182,0.25)] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#F472B6]/20 border border-[#F472B6]/50 flex items-center justify-center text-[#F472B6]">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#fbcfe8]">
                  Friend, Teacher &amp; Guide
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-[#F472B6] transition-colors">
                  Motivation
                </h3>
                <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1.5 leading-relaxed">
                  A lovely, friendly companion who listens to you like a best friend, teaches and guides you with patience, and motivates you to achieve it.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2A3362]/70 flex items-center justify-between text-xs font-display font-bold text-[#F472B6]">
              <span>Talk to Motivation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 4. MISSION (Mission Gold) */}
          <button
            type="button"
            onClick={() => onSelectCompanion('mission')}
            className="orbital-glass-gold rounded-3xl p-6 text-left flex flex-col justify-between group hover:border-[#FFB020] hover:shadow-[0_0_32px_rgba(255,176,32,0.25)] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#FFB020]/20 border border-[#FFB020]/50 flex items-center justify-center text-[#FFB020]">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#FFB020]">
                  Main Mission AI
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-[#FFB020] transition-colors">
                  Mission
                </h3>
                <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1.5 leading-relaxed">
                  Track your stage-gated JEE roadmap, check off today’s 3 mission tasks, build weekly plans, and remember why you started.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2A3362]/70 flex items-center justify-between text-xs font-display font-bold text-[#FFB020]">
              <span>View Roadmap &amp; Tasks</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 5. WORKOUT & BODYWEIGHT AI COACH */}
          <button
            type="button"
            onClick={() => onSelectCompanion('workout')}
            className="orbital-glass-cyan rounded-3xl p-6 text-left flex flex-col justify-between group hover:border-[#22D3EE] hover:shadow-[0_0_32px_rgba(34,211,238,0.22)] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#22D3EE]/15 border border-[#22D3EE]/40 flex items-center justify-center text-[#22D3EE]">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#22D3EE]">
                  Bodyweight &amp; BMI Lab
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-[#22D3EE] transition-colors">
                  Workout &amp; AI Coach
                </h3>
                <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1.5 leading-relaxed">
                  100% bodyweight daily schedules, BMI &amp; macro calculator (calories, protein, carbs, fat), food logger, rest-day toggle &amp; AI Coach.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2A3362]/70 flex items-center justify-between text-xs font-display font-bold text-[#22D3EE]">
              <span>Open Workout &amp; Macros</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 6. SKILLS & SKILL AI MENTOR */}
          <button
            type="button"
            onClick={() => onSelectCompanion('skills')}
            className="orbital-glass-2 rounded-3xl p-6 text-left flex flex-col justify-between group hover:border-[#7C5CFF] hover:shadow-[0_0_32px_rgba(124,92,255,0.25)] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/50 flex items-center justify-center text-[#cabeff]">
                  <Code2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#cabeff]">
                  Python, AI, Editing &amp; More
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-[#cabeff] transition-colors">
                  Skills &amp; AI Mentor
                </h3>
                <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1.5 leading-relaxed">
                  Add any skill you want to learn (Python, AI, Video Editing, Web Dev) and get guided 25-minute micro-lessons from your Skills AI.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2A3362]/70 flex items-center justify-between text-xs font-display font-bold text-[#cabeff]">
              <span>Open Skills Lab</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* Mood Check-In + Daily Quote Card Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Mood Check-In */}
        <div className="lg:col-span-7 orbital-glass-1 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#22D3EE]">
                Cockpit Check-In
              </span>
              <h3 className="text-base font-display font-bold text-white">
                How is your headspace right now, {profile.name}?
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = profile.lastMood === mood.id;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => onSelectMood(mood.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7C5CFF]/25 border-[#7C5CFF] text-white shadow-[0_0_16px_rgba(124,92,255,0.2)]'
                      : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#7C5CFF]/40'
                  }`}
                >
                  <div className="font-display font-bold text-xs text-white">
                    {mood.label}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] mt-1 line-clamp-2">
                    {mood.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {activeMoodObj && (
            <div className="p-3.5 rounded-2xl bg-[#0A0E1F]/80 border border-[#2A3362] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-[#dee1fa] leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 text-[#22D3EE] inline mr-1.5" />
                {activeMoodObj.feedback}
              </p>
              <button
                type="button"
                onClick={() => onSelectCompanion(activeMoodObj.suggestedAi)}
                className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#7C5CFF] text-white text-xs font-display font-semibold shrink-0 self-start sm:self-center cursor-pointer whitespace-nowrap"
              >
                Go to {activeMoodObj.suggestedAi.toUpperCase()}
              </button>
            </div>
          )}
        </div>

        {/* Daily Quote Card (Refreshed once per day via Grok) */}
        <div className="lg:col-span-5 orbital-glass-1 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-display font-semibold uppercase tracking-wider text-[#FFB020]">
                <Quote className="w-4 h-4" />
                <span>Daily Goal Transmission</span>
              </div>
              <button
                type="button"
                disabled={quoteLoading}
                onClick={() => fetchFreshDailyQuote(true)}
                aria-label="Refresh daily quote"
                className="min-h-[36px] px-3 py-1 rounded-full bg-[#131938] hover:bg-[#1e2652] border border-[#2A3362] text-[11px] text-[#CBD5E1] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <RefreshCw
                  className={`w-3 h-3 ${quoteLoading ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
            </div>

            <blockquote className="text-sm sm:text-base font-medium text-white leading-relaxed italic">
              “{dailyQuote.quote}”
            </blockquote>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2A3362]/70 flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>{dailyQuote.context}</span>
            <span className="font-mono-num">{dailyQuote.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
