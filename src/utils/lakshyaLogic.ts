export type StruggleType = 'Focus' | 'Stress' | 'Consistency' | 'Backlog';

export type CompanionId =
  | 'calm'
  | 'now'
  | 'motivation'
  | 'mission'
  | 'workout'
  | 'skills';

export type RoadmapStageId =
  | 'foundation'
  | 'practice'
  | 'mocks'
  | 'sprint'
  | 'jeeday';

export type MoodId = 'locked-in' | 'steady' | 'tired' | 'overwhelmed';

export type StudentClass =
  | 'Class 11'
  | 'Class 12'
  | 'Dropper / Repeater'
  | 'Foundation (9/10)';

export type MonthTiming = 'Starting of the month' | 'End of the month';

export type BodyGoalType =
  | 'Lean & Athletic'
  | 'Calisthenics & Muscular'
  | 'Core & Study Stamina'
  | 'Fat Loss & Toned';

export interface SyllabusTarget {
  month: string; // e.g., 'October', 'November', 'December'
  year: string; // e.g., '2026', '2027'
  timing: MonthTiming;
}

export interface FoodLogEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string; // YYYY-MM-DD
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  sessionsCompleted: number;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  goal: string;
  examYear: string;
  struggle: string; // formatted summary e.g. "Focus, Consistency"
  struggles?: StruggleType[]; // array of selected struggles
  studentClass?: StudentClass;
  // Backlog & Syllabus fields
  hasBacklog?: boolean;
  pendingChapters?: number;
  syllabusTarget?: SyllabusTarget;
  // Study hours fields
  currentStudyHours?: number; // How many hours they can currently study
  targetStudyHours?: number; // How many hours they want to study
  // Workout & BMI fields
  workoutHours?: 1 | 2; // Strictly 1 or 2 hours
  weightKg?: number;
  heightCm?: number;
  bodyGoal?: BodyGoalType;
  restDays?: string[]; // Array of YYYY-MM-DD dates marked as rest days
  foodLog?: FoodLogEntry[];
  // Skills list
  skills?: SkillItem[];
  streak: number;
  lastVisit: string; // ISO date string or YYYY-MM-DD
  createdAt: string;
  roadmapStage?: RoadmapStageId;
  stageProgress?: Record<RoadmapStageId, boolean[]>;
  lastMood?: MoodId;
  lastMoodDate?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  parsedAction?: ParsedNowAction | null;
}

export interface ParsedNowAction {
  action: string;
  why: string;
  timeMinutes: number;
}

export interface MissionTask {
  id: string;
  title: string;
  tag: string;
  completed: boolean;
}

export interface DailyQuote {
  date: string; // YYYY-MM-DD
  quote: string;
  context: string;
  goalSnapshot: string;
}

export const ROADMAP_STAGE_ORDER: RoadmapStageId[] = [
  'foundation',
  'practice',
  'mocks',
  'sprint',
  'jeeday',
];

export const DEFAULT_STAGE_CHECKLISTS: Record<
  RoadmapStageId,
  { title: string; tag: string }[]
> = {
  foundation: [
    {
      title: 'Complete core NCERT / lecture notes for current PCM chapters',
      tag: 'Concept Base',
    },
    {
      title: 'Build formula & reaction summary sheets for completed units',
      tag: 'Formula Bank',
    },
    {
      title: 'Solve 30 basic illustration examples without looking at solutions',
      tag: 'Foundation Check',
    },
  ],
  practice: [
    {
      title: 'Finish Level-1 & Level-2 coaching module exercises for active topics',
      tag: 'Module Grind',
    },
    {
      title: 'Solve last 5 years of JEE Main PYQs with a strict per-question timer',
      tag: 'Timed PYQs',
    },
    {
      title: 'Clear 100% of marked doubts from this week’s practice sets',
      tag: 'Doubt Clearance',
    },
  ],
  mocks: [
    {
      title: 'Complete 3 full-length 3-hour JEE mock tests under exam conditions',
      tag: 'Full Mocks',
    },
    {
      title: 'Log every wrong/unattempted mock question into the Mistake Notebook',
      tag: 'Error Audit',
    },
    {
      title: 'Re-solve all incorrect mock questions within 24 hours of the test',
      tag: 'Score Recovery',
    },
  ],
  sprint: [
    {
      title: 'Revise entire Mistake Notebook & high-weightage JEE chapters twice',
      tag: 'Rapid Revision',
    },
    {
      title: 'Hit target accuracy (85%+) in 2 consecutive timed revision papers',
      tag: 'Precision Sprint',
    },
    {
      title: 'Lock in biological clock to match exact JEE exam shift hours',
      tag: 'Body Clock',
    },
  ],
  jeeday: [
    {
      title: 'Pack admit card, ID, and stationery the night before exam day',
      tag: 'Logistics Ready',
    },
    {
      title: 'Complete 5 minutes of Calm 4-4-6 breathing before entering the hall',
      tag: 'Calm Mind',
    },
    {
      title: 'Execute paper in 3 rounds (Easy -> Medium -> Tough) with zero panic',
      tag: 'Peak Execution',
    },
  ],
};

/**
 * Formats an array of StruggleType items into a clean human-readable string.
 */
export function formatStrugglesList(
  struggles?: StruggleType[],
  fallback?: string
): string {
  if (Array.isArray(struggles) && struggles.length > 0) {
    return struggles.join(', ');
  }
  return fallback || 'Consistency';
}

/**
 * Formats the syllabus completion target into a concise badge string.
 */
export function formatSyllabusTarget(target?: SyllabusTarget): string {
  if (!target || !target.month || !target.year) {
    return 'End of the month · December 2026';
  }
  return `${target.timing} · ${target.month} ${target.year}`;
}

/**
 * Checks whether a specific roadmap stage has all its required tasks completed.
 */
export function isStageComplete(
  stage: RoadmapStageId,
  stageProgress?: Record<RoadmapStageId, boolean[]>
): boolean {
  const list = stageProgress?.[stage];
  const expectedLen = DEFAULT_STAGE_CHECKLISTS[stage].length;
  if (!Array.isArray(list) || list.length < expectedLen) return false;
  return list.slice(0, expectedLen).every(Boolean);
}

/**
 * Determines whether the user is allowed to enter `targetStage`.
 * A stage is unlocked ONLY if all preceding stages in ROADMAP_STAGE_ORDER are 100% completed!
 */
export function canUnlockStage(
  targetStage: RoadmapStageId,
  stageProgress?: Record<RoadmapStageId, boolean[]>
): boolean {
  const targetIdx = ROADMAP_STAGE_ORDER.indexOf(targetStage);
  if (targetIdx <= 0) return true; // 'foundation' is always unlocked
  for (let i = 0; i < targetIdx; i++) {
    const prevStage = ROADMAP_STAGE_ORDER[i];
    if (!isStageComplete(prevStage, stageProgress)) {
      return false;
    }
  }
  return true;
}

/**
 * Formats a Date or ISO string to YYYY-MM-DD in local time.
 */
export function toLocalDateKey(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD date keys.
 */
export function diffCalendarDays(
  earlierDateKey: string,
  laterDateKey: string
): number {
  const [y1, m1, d1] = earlierDateKey.split('-').map(Number);
  const [y2, m2, d2] = laterDateKey.split('-').map(Number);
  const utc1 = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const utc2 = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the daily study hours target.
 * If the user's current study capacity (`currentStudyHours`) is lower than what they want to study (`targetStudyHours`),
 * the system increases their daily study timing by +30 minutes (+0.5 hours) per day until they reach their target!
 */
export function calculateDailyStudyPlan(
  profile: Partial<UserProfile>,
  now: Date = new Date()
): {
  currentHours: number;
  targetHours: number;
  todayRecommendedHours: number;
  addedMinutesToday: number;
  isSteppedUp: boolean;
  formattedTodayTarget: string;
} {
  const currentHours = Math.max(
    1,
    Number(profile.currentStudyHours ?? 5)
  );
  const targetHours = Math.max(
    currentHours,
    Number(profile.targetStudyHours ?? 8)
  );

  if (currentHours >= targetHours) {
    return {
      currentHours,
      targetHours,
      todayRecommendedHours: currentHours,
      addedMinutesToday: 0,
      isSteppedUp: false,
      formattedTodayTarget: `${currentHours} hrs`,
    };
  }

  const createdKey = profile.createdAt
    ? toLocalDateKey(profile.createdAt)
    : toLocalDateKey(now);
  const todayKey = toLocalDateKey(now);
  // Day 1 starts with +1 step (+30 mins extra), Day 2 adds +60 mins, etc., or uses streak
  const daysActive = Math.max(
    1,
    diffCalendarDays(createdKey, todayKey) + 1,
    profile.streak || 1
  );
  const extraHalfHours = daysActive * 0.5;
  const todayRecommendedHours = Math.min(
    targetHours,
    currentHours + extraHalfHours
  );
  const addedMinutesToday = Math.round(
    (todayRecommendedHours - currentHours) * 60
  );

  const wholeHours = Math.floor(todayRecommendedHours);
  const remMins = Math.round((todayRecommendedHours - wholeHours) * 60);
  const formattedTodayTarget =
    remMins > 0 ? `${wholeHours} hrs ${remMins} min` : `${wholeHours} hrs`;

  return {
    currentHours,
    targetHours,
    todayRecommendedHours,
    addedMinutesToday,
    isSteppedUp: true,
    formattedTodayTarget,
  };
}

/**
 * Calculates BMI and daily Calorie / Protein / Carbs / Fat targets based on weight (kg), height (cm),
 * workout duration (1 or 2 hrs), and body goal.
 */
export function calculateBmiAndMacros(params: {
  weightKg?: number;
  heightCm?: number;
  workoutHours?: 1 | 2;
  bodyGoal?: BodyGoalType;
}): {
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal / Fit' | 'Overweight' | 'Obese';
  dailyCalories: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
} {
  const weight = Math.max(30, Math.min(180, Number(params.weightKg || 62)));
  const height = Math.max(120, Math.min(220, Number(params.heightCm || 172)));
  const workoutHours = params.workoutHours === 2 ? 2 : 1;
  const bodyGoal = params.bodyGoal || 'Lean & Athletic';

  const heightM = height / 100;
  const bmi = Number((weight / (heightM * heightM)).toFixed(1));

  let bmiCategory: 'Underweight' | 'Normal / Fit' | 'Overweight' | 'Obese' =
    'Normal / Fit';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi < 25) bmiCategory = 'Normal / Fit';
  else if (bmi < 30) bmiCategory = 'Overweight';
  else bmiCategory = 'Obese';

  // Mifflin-St Jeor baseline for young student (~17yo) + activity multiplier for 1h or 2h bodyweight workout
  const bmr = 10 * weight + 6.25 * height - 5 * 17 + 5;
  const activityFactor = workoutHours === 2 ? 1.62 : 1.48;
  let calories = Math.round(bmr * activityFactor);

  if (bodyGoal === 'Calisthenics & Muscular' || bmiCategory === 'Underweight') {
    calories += 250;
  } else if (bodyGoal === 'Fat Loss & Toned' || bmiCategory === 'Overweight' || bmiCategory === 'Obese') {
    calories = Math.max(1600, calories - 300);
  }

  // Protein: 1.8g - 2.0g per kg of body weight for bodyweight muscle recovery
  const proteinMultiplier =
    bodyGoal === 'Calisthenics & Muscular' ? 2.0 : 1.8;
  const dailyProteinG = Math.round(weight * proteinMultiplier);
  const dailyFatG = Math.round((calories * 0.25) / 9);
  const remainingCals = Math.max(
    400,
    calories - dailyProteinG * 4 - dailyFatG * 9
  );
  const dailyCarbsG = Math.round(remainingCals / 4);

  return {
    bmi,
    bmiCategory,
    dailyCalories: calories,
    dailyProteinG,
    dailyCarbsG,
    dailyFatG,
  };
}

/**
 * Smart food nutrition estimator: parses common Indian & global student meals (with quantity multipliers)
 * and calculates Calories, Protein (g), Carbs (g), and Fat (g).
 */
export function estimateFoodMacros(foodInput: string): {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const cleanName = (foodInput || '').trim() || 'Balanced Meal';
  const lower = cleanName.toLowerCase();

  // Extract leading or embedded multiplier e.g. "2 boiled eggs", "3 rotis"
  const numMatch = lower.match(/(\d+(?:\.\d+)?)/);
  const qty = numMatch ? Math.min(20, Math.max(0.5, parseFloat(numMatch[1]))) : 1;

  // Per-unit / per-serving lookup table
  const catalog: {
    keywords: string[];
    cals: number;
    p: number;
    c: number;
    f: number;
    unitScaled: boolean;
  }[] = [
    { keywords: ['egg', 'eggs', 'omelette'], cals: 78, p: 6.5, c: 0.6, f: 5.3, unitScaled: true },
    { keywords: ['roti', 'chapati', 'phulka'], cals: 105, p: 3.1, c: 22, f: 0.9, unitScaled: true },
    { keywords: ['paratha', 'aloo paratha'], cals: 210, p: 4.5, c: 29, f: 8.5, unitScaled: true },
    { keywords: ['paneer'], cals: 265, p: 18.3, c: 3.4, f: 20.8, unitScaled: false },
    { keywords: ['chicken', 'chicken breast'], cals: 240, p: 38, c: 0, f: 5.5, unitScaled: false },
    { keywords: ['dal', 'lentil', 'sambar', 'rajma', 'chole'], cals: 190, p: 11, c: 28, f: 3.8, unitScaled: false },
    { keywords: ['rice', 'biryani', 'pulao', 'khichdi'], cals: 240, p: 5.5, c: 48, f: 2.5, unitScaled: false },
    { keywords: ['oats', 'oatmeal', 'porridge'], cals: 220, p: 8.5, c: 36, f: 4.2, unitScaled: false },
    { keywords: ['banana'], cals: 105, p: 1.3, c: 27, f: 0.4, unitScaled: true },
    { keywords: ['apple', 'orange', 'fruit'], cals: 95, p: 0.5, c: 25, f: 0.3, unitScaled: true },
    { keywords: ['milk', 'shake', 'smoothie'], cals: 165, p: 8.2, c: 13, f: 8.0, unitScaled: false },
    { keywords: ['whey', 'protein scoop', 'protein shake'], cals: 130, p: 24, c: 3, f: 1.5, unitScaled: true },
    { keywords: ['peanut butter', 'peanuts', 'almonds', 'nuts'], cals: 190, p: 7.5, c: 7, f: 16, unitScaled: false },
    { keywords: ['dosa', 'idli', 'uttapam'], cals: 140, p: 3.8, c: 26, f: 2.2, unitScaled: true },
    { keywords: ['poha', 'upma'], cals: 230, p: 5.2, c: 40, f: 5.5, unitScaled: false },
    { keywords: ['curd', 'yogurt', 'dahi', 'buttermilk'], cals: 110, p: 6.5, c: 8, f: 5.0, unitScaled: false },
    { keywords: ['bread', 'toast', 'sandwich'], cals: 140, p: 4.5, c: 25, f: 2.5, unitScaled: true },
    { keywords: ['salad', 'sprouts', 'chana'], cals: 160, p: 9.5, c: 24, f: 2.5, unitScaled: false },
  ];

  let totalCals = 0;
  let totalP = 0;
  let totalC = 0;
  let totalF = 0;
  let matched = false;

  for (const item of catalog) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      matched = true;
      const scale = item.unitScaled ? qty : qty > 10 ? qty / 100 : 1;
      totalCals += item.cals * scale;
      totalP += item.p * scale;
      totalC += item.c * scale;
      totalF += item.f * scale;
    }
  }

  if (!matched) {
    // Sensible balanced meal estimate if custom food name
    const scale = qty > 1 && qty <= 6 ? qty : 1;
    totalCals = 250 * scale;
    totalP = 10 * scale;
    totalC = 34 * scale;
    totalF = 8 * scale;
  }

  return {
    name: cleanName,
    calories: Math.round(totalCals),
    protein: Math.round(totalP),
    carbs: Math.round(totalC),
    fat: Math.round(totalF),
  };
}

/**
 * Updates the user's streak based on their lastVisit and current date.
 */
export function calculateUpdatedStreak(
  profile: UserProfile,
  now: Date = new Date()
): { streak: number; lastVisit: string; changed: boolean } {
  const todayKey = toLocalDateKey(now);
  const lastVisitKey = profile.lastVisit
    ? toLocalDateKey(profile.lastVisit)
    : '';

  if (!lastVisitKey) {
    return {
      streak: Math.max(1, profile.streak || 1),
      lastVisit: now.toISOString(),
      changed: true,
    };
  }

  const dayDiff = diffCalendarDays(lastVisitKey, todayKey);

  if (dayDiff === 0) {
    return {
      streak: Math.max(1, profile.streak || 1),
      lastVisit: profile.lastVisit,
      changed: false,
    };
  }

  if (dayDiff === 1) {
    return {
      streak: Math.max(1, profile.streak || 0) + 1,
      lastVisit: now.toISOString(),
      changed: true,
    };
  }

  return {
    streak: 1,
    lastVisit: now.toISOString(),
    changed: true,
  };
}

/**
 * Calculates days remaining until JEE exam for the target examYear.
 */
export function calculateDaysToExam(
  examYear: string,
  now: Date = new Date()
): { daysRemaining: number; targetLabel: string; targetDateIso: string } {
  const parsedYear = parseInt(examYear, 10) || now.getFullYear() + 1;

  const janTarget = new Date(parsedYear, 0, 22, 9, 0, 0);
  const mayTarget = new Date(parsedYear, 4, 24, 9, 0, 0);

  let targetDate = janTarget;
  let targetLabel = `JEE ${parsedYear} · Jan Session`;

  if (
    now.getTime() >= janTarget.getTime() &&
    now.getTime() < mayTarget.getTime()
  ) {
    targetDate = mayTarget;
    targetLabel = `JEE Advanced ${parsedYear}`;
  } else if (now.getTime() >= mayTarget.getTime()) {
    const nextYear = now.getFullYear() + 1;
    targetDate = new Date(nextYear, 0, 22, 9, 0, 0);
    targetLabel = `JEE ${nextYear} · Jan Session`;
  }

  const diffMs = targetDate.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    daysRemaining,
    targetLabel,
    targetDateIso: targetDate.toISOString().split('T')[0],
  };
}

/**
 * Builds the system prompt for each AI companion (Calm, Now, Motivation, Mission, Workout, Skills).
 */
export function buildCompanionSystemPrompt(
  companion: CompanionId,
  profile: UserProfile
): string {
  const name = profile.name?.trim() || 'Aspirant';
  const goal = profile.goal?.trim() || 'Crack JEE with top rank';
  const struggle = formatStrugglesList(profile.struggles, profile.struggle);
  const examYear = profile.examYear || '2027';
  const studentClass = profile.studentClass || 'Class 12';
  const syllabusDeadline = formatSyllabusTarget(profile.syllabusTarget);
  const hasBacklog = Boolean(profile.hasBacklog);
  const pendingChapters = profile.pendingChapters || 0;
  const studyPlan = calculateDailyStudyPlan(profile);

  const backlogDirective = hasBacklog
    ? `CRITICAL SYSTEM FOCUS: ${name} has ACTIVE BACKLOGS (${pendingChapters} chapters pending) and must complete the entire syllabus by ${syllabusDeadline}. Focus all study strategy on finishing the syllabus and clearing these ${pendingChapters} backlog chapters step-by-step before ${syllabusDeadline}.`
    : `${name} has NO backlogs right now—focus on high-accuracy problem practice, mock tests, and revision.`;

  if (companion === 'calm') {
    return `You are Calm, a warm, grounded companion for a JEE aspirant named ${name} (${studentClass}) whose goal is: ${goal} (Target Exam: JEE ${examYear}). ${backlogDirective} Their biggest struggle is ${struggle}. Your job is stress relief only. Validate feelings first in 1-2 sentences, then offer ONE small practical thing: a breathing exercise, a 5-minute reset, a reframe, or a grounding technique. Keep replies under 120 words. Never give study plans. Use the student's name sparingly. If the student mentions self-harm, hopelessness, or severe distress, respond with care, encourage them to talk to a trusted person immediately, and share India's Tele-MANAS helpline 14416 (24x7, free). Never be preachy.`;
  }

  if (companion === 'now') {
    return `You are Now, a decisive study coach for ${name} (${studentClass}), a JEE aspirant with the goal: ${goal} (Target Exam: JEE ${examYear}, main struggles: ${struggle}, daily study target today: ${studyPlan.formattedTodayTarget}). ${backlogDirective} Reply with ONE clear action to do right now in this format: ACTION (one line), WHY (one line), TIME (minutes). Always start the three lines with "ACTION:", "WHY:", and "TIME:". Match difficulty to energy: low energy = light revision, PYQs, formula sheets; high energy = ${hasBacklog ? `attacking 1 pending backlog chapter (${pendingChapters} left before ${syllabusDeadline})` : 'hard JEE Advanced problem solving or mock test drills'}. Tone: confident friend, not teacher.`;
  }

  if (companion === 'motivation') {
    return `You are Motivation (Mitra), a lovely, warm, friendly companion for ${name} (${studentClass}), a JEE/IIT aspirant working toward: "${goal}" (Target Exam: JEE ${examYear}, biggest struggles: ${struggle}). ${backlogDirective} Today's stepped-up study goal is ${studyPlan.formattedTodayTarget}. You are their close friend, caring teacher, and personal guide all in one. Listen empathetically, guide them with clear wisdom, and motivate them with genuine warmth. Keep replies around 100-160 words. If severe distress or self-harm is mentioned, respond with care and share India's Tele-MANAS helpline 14416 (24x7, free).`;
  }

  if (companion === 'workout') {
    const bmiInfo = calculateBmiAndMacros({
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      workoutHours: profile.workoutHours,
      bodyGoal: profile.bodyGoal,
    });
    return `You are the LAKSHYA Bodyweight Fitness & Nutrition AI Coach for ${name}, a JEE aspirant (${studentClass}). STRICT RULE: Recommend ONLY 100% BODYWEIGHT workouts (push-ups, pull-ups, squats, lunges, planks, burpees, calisthenics, core & posture mobility)—never gym machines or heavy weights. Their target body type is "${profile.bodyGoal || 'Lean & Athletic'}", daily workout allowance is ${profile.workoutHours || 1} hour(s) (max 2 hours so they have time to study for JEE!), weight is ${profile.weightKg || 62}kg, height is ${profile.heightCm || 172}cm, BMI is ${bmiInfo.bmi} (${bmiInfo.bmiCategory}), and daily macro targets are ${bmiInfo.dailyCalories} kcal (${bmiInfo.dailyProteinG}g Protein, ${bmiInfo.dailyCarbsG}g Carbs, ${bmiInfo.dailyFatG}g Fat). Ask what type of body they want to build, give crisp bodyweight circuits, and keep energy high for their ${studyPlan.formattedTodayTarget} daily JEE study schedule!`;
  }

  if (companion === 'skills') {
    const skillNames =
      profile.skills && profile.skills.length > 0
        ? profile.skills.map((s) => s.name).join(', ')
        : 'Python, AI & Video Editing';
    return `You are the LAKSHYA Skills AI Mentor for ${name}, a JEE aspirant (${studentClass}) whose main exam goal is "${goal}" and who is also learning side skills: ${skillNames}. Help ${name} learn these skills (${skillNames}) in focused 20–30 minute micro-sessions, explain concepts clearly with examples, and give practical mini-projects without derailing their ${studyPlan.formattedTodayTarget} JEE study routine.`;
  }

  return `You are Mission, a mentor who keeps ${name} (${studentClass}) connected to their big why: ${goal} (Target Exam: JEE ${examYear}, main struggles: ${struggle}, daily study target: ${studyPlan.formattedTodayTarget}). ${backlogDirective} Help them break the goal into milestones, create weekly plans, and give powerful but honest pep talks. Be specific to their goal. Avoid generic quotes. Keep replies under 180 words unless they ask for a plan. Be realistic: never promise results.`;
}

/**
 * Parses the structured response from the "Now" AI companion:
 * ACTION (one line), WHY (one line), TIME (minutes)
 */
export function parseNowAction(
  rawText: string,
  fallbackMinutes: number = 30,
  forceFallback: boolean = false
): ParsedNowAction | null {
  if (!rawText || typeof rawText !== 'string') return null;

  const cleaned = rawText.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').trim();

  const actionMatch = cleaned.match(
    /ACTION(?:\s*\([^)]*\))?\s*[:\-–]\s*([^\n]+|\n\s*[^\n]+)/i
  );
  const whyMatch = cleaned.match(
    /WHY(?:\s*\([^)]*\))?\s*[:\-–]\s*([^\n]+|\n\s*[^\n]+)/i
  );
  const timeMatch = cleaned.match(
    /TIME(?:\s*\([^)]*\))?\s*[:\-–]\s*(\d+)/i
  );

  if (!actionMatch && !whyMatch) {
    if (!forceFallback) return null;
    const lines = cleaned
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    return {
      action: lines[0] || 'Solve 10 focused JEE PYQs from your current topic.',
      why:
        lines[1] ||
        'Direct problem practice builds momentum and clears decision fatigue.',
      timeMinutes: fallbackMinutes,
    };
  }

  const action = actionMatch
    ? actionMatch[1].trim()
    : cleaned.split('\n')[0].trim();
  const why = whyMatch
    ? whyMatch[1].trim()
    : 'Builds direct momentum toward your JEE target without decision fatigue.';
  const parsedMins = timeMatch ? parseInt(timeMatch[1], 10) : fallbackMinutes;
  const timeMinutes =
    Number.isFinite(parsedMins) && parsedMins > 0
      ? parsedMins
      : fallbackMinutes;

  return {
    action,
    why,
    timeMinutes,
  };
}

/**
 * Detects severe distress or self-harm keywords to ensure immediate Tele-MANAS 14416 support.
 */
export function containsSevereDistress(text: string): boolean {
  const lower = (text || '').toLowerCase();
  const keywords = [
    'self-harm',
    'self harm',
    'suicide',
    'suicidal',
    'end my life',
    'kill myself',
    'want to die',
    'no point in living',
    'hopeless',
    'give up on life',
    'hurt myself',
  ];
  return keywords.some((kw) => lower.includes(kw));
}
