import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Sparkles,
  Check,
  GraduationCap,
  Clock,
  RotateCcw,
  Layers,
  BookOpenCheck,
  Dumbbell,
  AlertTriangle,
} from 'lucide-react';
import {
  MonthTiming,
  StudentClass,
  StruggleType,
  UserProfile,
  formatStrugglesList,
} from '../utils/lakshyaLogic';

interface ProfileModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
  onRestartOnboarding?: () => void;
}

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

const YEARS = ['2026', '2027', '2028', '2029'];
const TIMING_OPTIONS: MonthTiming[] = [
  'Starting of the month',
  'End of the month',
];
const STRUGGLES: StruggleType[] = ['Focus', 'Stress', 'Consistency', 'Backlog'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
  onRestartOnboarding,
}) => {
  const [name, setName] = useState(profile.name);
  const [goal, setGoal] = useState(profile.goal);
  const [studentClass, setStudentClass] = useState<StudentClass>(
    profile.studentClass || 'Class 12'
  );
  const [hasBacklog, setHasBacklog] = useState<boolean>(
    Boolean(profile.hasBacklog)
  );
  const [pendingChapters, setPendingChapters] = useState<number>(
    profile.pendingChapters || 8
  );
  const [syllabusMonth, setSyllabusMonth] = useState<string>(
    profile.syllabusTarget?.month || 'December'
  );
  const [syllabusYear, setSyllabusYear] = useState<string>(
    profile.syllabusTarget?.year || '2026'
  );
  const [syllabusTiming, setSyllabusTiming] = useState<MonthTiming>(
    profile.syllabusTarget?.timing || 'End of the month'
  );
  const [currentStudyHours, setCurrentStudyHours] = useState<number>(
    profile.currentStudyHours || 4
  );
  const [targetStudyHours, setTargetStudyHours] = useState<number>(
    profile.targetStudyHours || 9
  );
  const [workoutHours, setWorkoutHours] = useState<1 | 2>(
    profile.workoutHours || 1
  );
  const [workoutOverLimitMsg, setWorkoutOverLimitMsg] = useState<string>('');
  const [examYear, setExamYear] = useState(profile.examYear);
  const [selectedStruggles, setSelectedStruggles] = useState<StruggleType[]>(
    profile.struggles && profile.struggles.length > 0
      ? profile.struggles
      : ['Consistency']
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setGoal(profile.goal);
      setStudentClass(profile.studentClass || 'Class 12');
      setHasBacklog(Boolean(profile.hasBacklog));
      setPendingChapters(profile.pendingChapters || 8);
      setSyllabusMonth(profile.syllabusTarget?.month || 'December');
      setSyllabusYear(profile.syllabusTarget?.year || '2026');
      setSyllabusTiming(profile.syllabusTarget?.timing || 'End of the month');
      setCurrentStudyHours(profile.currentStudyHours || 4);
      setTargetStudyHours(profile.targetStudyHours || 9);
      setWorkoutHours(profile.workoutHours || 1);
      setWorkoutOverLimitMsg('');
      setExamYear(profile.examYear);
      setSelectedStruggles(
        profile.struggles && profile.struggles.length > 0
          ? profile.struggles
          : ['Consistency']
      );
      setError('');
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const toggleStruggle = (id: StruggleType) => {
    setSelectedStruggles((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (!goal.trim()) {
      setError('Your main goal cannot be empty.');
      return;
    }
    if (selectedStruggles.length === 0) {
      setError('Please select at least 1 struggle checkbox.');
      return;
    }

    onSave({
      ...profile,
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
      examYear,
      struggles: selectedStruggles,
      struggle: formatStrugglesList(selectedStruggles),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0E1F]/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-2xl orbital-glass-2 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(124,92,255,0.22)] relative my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-display font-semibold tracking-wider text-[#22D3EE] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aspirant Profile &amp; Study Settings</span>
            </span>
            <h2
              id="edit-profile-title"
              className="text-xl font-display font-bold text-white mt-0.5"
            >
              Edit Your Goal &amp; Trajectory
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit profile modal"
            className="min-h-[44px] min-w-[44px] rounded-full bg-[#131938] hover:bg-[#1E264F] border border-[#2A3362] text-[#CBD5E1] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="edit-profile-name"
              className="block text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5"
            >
              Your Name
            </label>
            <input
              id="edit-profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#0A0E1F]/85 border border-[#2A3362] focus:border-[#7C5CFF] focus:outline-none text-white text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="edit-profile-goal"
              className="block text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5"
            >
              Main JEE / IIT Goal
            </label>
            <textarea
              id="edit-profile-goal"
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#0A0E1F]/85 border border-[#2A3362] focus:border-[#7C5CFF] focus:outline-none text-white text-sm resize-none"
            />
          </div>

          {/* Current Class */}
          <div>
            <span className="flex items-center gap-1.5 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              <GraduationCap className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Which Class Are You In?</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CLASS_OPTIONS.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setStudentClass(cls)}
                  className={`min-h-[42px] px-2.5 rounded-xl font-display font-bold text-xs border transition-all cursor-pointer ${
                    studentClass === cls
                      ? 'bg-[#22D3EE]/18 border-[#22D3EE] text-[#22D3EE]'
                      : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Do you have Backlogs? */}
          <div className="space-y-3">
            <span className="flex items-center gap-1.5 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-[#FFB020]" />
              <span>Do You Have Backlogs?</span>
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setHasBacklog(true)}
                className={`min-h-[44px] px-3 py-2 rounded-xl font-display font-bold text-xs border flex items-center justify-between cursor-pointer ${
                  hasBacklog
                    ? 'bg-[#FFB020]/20 border-[#FFB020] text-[#FFB020]'
                    : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                }`}
              >
                <span>Yes, I have Backlogs</span>
                {hasBacklog && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setHasBacklog(false)}
                className={`min-h-[44px] px-3 py-2 rounded-xl font-display font-bold text-xs border flex items-center justify-between cursor-pointer ${
                  !hasBacklog
                    ? 'bg-[#22D3EE]/18 border-[#22D3EE] text-[#22D3EE]'
                    : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                }`}
              >
                <span>No Backlogs (Normal Mode)</span>
                {!hasBacklog && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>

            {hasBacklog && (
              <div className="p-4 rounded-2xl bg-[#0A0E1F]/85 border border-[#FFB020]/50 space-y-3">
                <label
                  htmlFor="edit-pending-chapters"
                  className="block text-xs font-display font-semibold text-[#FFB020] uppercase tracking-wider"
                >
                  How Many Chapters Are Pending?
                </label>
                <input
                  id="edit-pending-chapters"
                  type="number"
                  min={1}
                  max={90}
                  value={pendingChapters}
                  onChange={(e) =>
                    setPendingChapters(
                      Math.max(1, parseInt(e.target.value, 10) || 1)
                    )
                  }
                  className="w-full h-10 px-3.5 rounded-xl bg-[#131938] border border-[#FFB020]/50 text-sm text-white font-mono-num font-bold"
                />
              </div>
            )}
          </div>

          {/* Syllabus Completion Target (Year, Month, Starting/End of the month) */}
          <div className="space-y-2.5">
            <span className="flex items-center gap-1.5 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#FFB020]" />
              <span>When Do You Want to Complete the Syllabus?</span>
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="edit-syllabus-year"
                  className="block text-[11px] text-[#94A3B8] mb-1"
                >
                  Target Year
                </label>
                <select
                  id="edit-syllabus-year"
                  value={syllabusYear}
                  onChange={(e) => setSyllabusYear(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0A0E1F]/90 border border-[#2A3362] text-xs text-white font-display font-semibold"
                >
                  {YEARS.map((yr) => (
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
                  htmlFor="edit-syllabus-month"
                  className="block text-[11px] text-[#94A3B8] mb-1"
                >
                  Target Month
                </label>
                <select
                  id="edit-syllabus-month"
                  value={syllabusMonth}
                  onChange={(e) => setSyllabusMonth(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0A0E1F]/90 border border-[#2A3362] text-xs text-white font-display font-semibold"
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
            <div className="grid grid-cols-2 gap-2">
              {TIMING_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSyllabusTiming(t)}
                  className={`min-h-[42px] px-3 rounded-xl font-display font-bold text-xs border transition-all cursor-pointer flex items-center justify-between ${
                    syllabusTiming === t
                      ? 'bg-[#FFB020]/20 border-[#FFB020] text-[#FFB020]'
                      : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                  }`}
                >
                  <span>{t}</span>
                  {syllabusTiming === t && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Study Hours (Can Study vs Want to Study) & Workout Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-current-study-hours"
                className="flex items-center gap-1.5 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5"
              >
                <BookOpenCheck className="w-3.5 h-3.5 text-[#7C5CFF]" />
                <span>Hours You Can Study Now</span>
              </label>
              <input
                id="edit-current-study-hours"
                type="number"
                min={1}
                max={16}
                value={currentStudyHours}
                onChange={(e) =>
                  setCurrentStudyHours(
                    Math.max(1, Math.min(16, Number(e.target.value) || 1))
                  )
                }
                className="w-full h-10 px-3.5 rounded-xl bg-[#0A0E1F]/85 border border-[#2A3362] text-white text-sm font-mono-num"
              />
            </div>

            <div>
              <label
                htmlFor="edit-target-study-hours"
                className="flex items-center gap-1.5 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5"
              >
                <BookOpenCheck className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Hours You Want to Study</span>
              </label>
              <input
                id="edit-target-study-hours"
                type="number"
                min={1}
                max={16}
                value={targetStudyHours}
                onChange={(e) =>
                  setTargetStudyHours(
                    Math.max(1, Math.min(16, Number(e.target.value) || 1))
                  )
                }
                className="w-full h-10 px-3.5 rounded-xl bg-[#0A0E1F]/85 border border-[#2A3362] text-white text-sm font-mono-num"
              />
            </div>
          </div>

          {/* Workout Hours (1 Hour or 2 Hours only) */}
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
              <Dumbbell className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Daily Workout Hours (1h or 2h Max)</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setWorkoutHours(1);
                  setWorkoutOverLimitMsg('');
                }}
                className={`min-h-[42px] rounded-xl font-display font-bold text-xs border cursor-pointer ${
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
                className={`min-h-[42px] rounded-xl font-display font-bold text-xs border cursor-pointer ${
                  workoutHours === 2
                    ? 'bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE]'
                    : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                }`}
              >
                2 Hours
              </button>
              <button
                type="button"
                onClick={() =>
                  setWorkoutOverLimitMsg(
                    'You NEED time to study for JEE! Workout is capped at 1 or 2 hours.'
                  )
                }
                className="min-h-[42px] rounded-xl font-display font-semibold text-xs border bg-[#0A0E1F]/50 border-[#2A3362] text-[#94A3B8] hover:text-[#ffb4ab] cursor-pointer"
              >
                More than 2h?
              </button>
            </div>
            {workoutOverLimitMsg && (
              <p
                role="alert"
                className="text-xs text-[#ffb4ab] flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{workoutOverLimitMsg}</span>
              </p>
            )}
          </div>

          {/* JEE Mains & Advanced Exam Year */}
          <div>
            <span className="block text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              JEE Mains &amp; Advanced Exam Year
            </span>
            <div className="grid grid-cols-4 gap-2">
              {YEARS.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setExamYear(yr)}
                  className={`min-h-[44px] rounded-xl font-display font-bold text-xs border transition-all cursor-pointer ${
                    examYear === yr
                      ? 'bg-[#22D3EE]/18 border-[#22D3EE] text-[#22D3EE]'
                      : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                  }`}
                >
                  JEE {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Select Struggle Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
                Biggest Struggles (Select 1 or More)
              </span>
              <span className="text-xs font-mono-num text-[#cabeff]">
                {selectedStruggles.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STRUGGLES.map((st) => {
                const checked = selectedStruggles.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleStruggle(st)}
                    className={`min-h-[44px] px-3 rounded-xl font-display font-semibold text-xs border transition-all cursor-pointer flex items-center justify-between ${
                      checked
                        ? 'bg-[#7C5CFF]/25 border-[#7C5CFF] text-white'
                        : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1]'
                    }`}
                  >
                    <span>{st}</span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        checked
                          ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white'
                          : 'border-[#2A3362]'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-[#ffb4ab] font-medium">
              {error}
            </p>
          )}

          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#2A3362]/70">
            {onRestartOnboarding ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRestartOnboarding();
                }}
                className="min-h-[42px] px-4 py-2 rounded-full bg-[#131938] hover:bg-[#1e2652] border border-[#2A3362] text-xs font-display font-semibold text-[#22D3EE] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Step-by-Step Setup Wizard</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#2A3362] text-xs font-display font-semibold text-[#CBD5E1] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#633BF3] hover:shadow-[0_0_24px_rgba(124,92,255,0.45)] text-white text-xs font-display font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
