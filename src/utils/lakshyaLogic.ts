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
  breakdown?: string;
  aiAnalyzed?: boolean;
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
  breakdown: string;
} {
  const rawClean = (foodInput || '').trim() || 'Balanced Meal';
  const cleanName =
    rawClean
      .replace(/^(?:i\s+(?:just\s+)?(?:ate|had|consumed)|had|ate|eating|for\s+(?:breakfast|lunch|dinner|snacks?)\s+i\s+had)\s+/i, '')
      .trim() || rawClean;
  const lower = cleanName.toLowerCase();

  const catalog: {
    keywords: string[];
    cals: number;
    p: number;
    c: number;
    f: number;
    unitScaled: boolean;
    label: string;
  }[] = [
    { keywords: ['egg white', 'egg whites'], cals: 17, p: 3.6, c: 0.2, f: 0.1, unitScaled: true, label: 'egg white' },
    { keywords: ['egg bhurji', 'scrambled eggs'], cals: 195, p: 13, c: 3, f: 14, unitScaled: false, label: 'egg bhurji' },
    { keywords: ['egg', 'eggs', 'omelette', 'omelet'], cals: 78, p: 6.5, c: 0.6, f: 5.3, unitScaled: true, label: 'egg' },
    { keywords: ['aloo paratha', 'gobi paratha', 'paneer paratha'], cals: 250, p: 6, c: 33, f: 10.5, unitScaled: true, label: 'stuffed paratha' },
    { keywords: ['paratha', 'lachha paratha'], cals: 210, p: 4.5, c: 29, f: 8.5, unitScaled: true, label: 'paratha' },
    { keywords: ['roti', 'chapati', 'phulka', 'bhakri'], cals: 105, p: 3.1, c: 22, f: 0.9, unitScaled: true, label: 'roti' },
    { keywords: ['naan', 'kulcha', 'bhatura'], cals: 260, p: 7, c: 45, f: 5.5, unitScaled: true, label: 'naan/kulcha' },
    { keywords: ['paneer tikka', 'paneer bhurji', 'kadai paneer', 'palak paneer'], cals: 290, p: 16, c: 9, f: 21, unitScaled: false, label: 'paneer dish' },
    { keywords: ['paneer', 'cottage cheese'], cals: 265, p: 18.3, c: 3.4, f: 20.8, unitScaled: false, label: 'paneer' },
    { keywords: ['tofu'], cals: 120, p: 13, c: 2.5, f: 6.5, unitScaled: false, label: 'tofu' },
    { keywords: ['butter chicken', 'chicken curry'], cals: 340, p: 24, c: 11, f: 22, unitScaled: false, label: 'chicken curry' },
    { keywords: ['chicken breast', 'grilled chicken', 'chicken'], cals: 195, p: 32, c: 0, f: 6.5, unitScaled: false, label: 'chicken' },
    { keywords: ['fish', 'salmon', 'tuna'], cals: 185, p: 24, c: 0, f: 9.5, unitScaled: false, label: 'fish' },
    { keywords: ['dal makhani'], cals: 280, p: 9, c: 26, f: 15, unitScaled: false, label: 'dal makhani' },
    { keywords: ['dal', 'lentil', 'sambar', 'rasam', 'rajma', 'chole', 'kadhi'], cals: 185, p: 10.5, c: 27, f: 3.8, unitScaled: false, label: 'dal/legumes' },
    { keywords: ['biryani'], cals: 420, p: 18, c: 52, f: 15, unitScaled: false, label: 'biryani' },
    { keywords: ['fried rice'], cals: 330, p: 8, c: 50, f: 11, unitScaled: false, label: 'fried rice' },
    { keywords: ['rice', 'pulao', 'khichdi', 'jeera rice', 'curd rice'], cals: 230, p: 5, c: 47, f: 2.2, unitScaled: false, label: 'rice' },
    { keywords: ['oats', 'oatmeal', 'porridge', 'muesli'], cals: 215, p: 8.5, c: 36, f: 4.2, unitScaled: false, label: 'oats' },
    { keywords: ['cornflakes', 'cereal'], cals: 145, p: 3, c: 32, f: 0.5, unitScaled: false, label: 'cereal' },
    { keywords: ['banana'], cals: 105, p: 1.3, c: 27, f: 0.4, unitScaled: true, label: 'banana' },
    { keywords: ['apple', 'orange', 'mango', 'pear', 'guava', 'fruit'], cals: 95, p: 0.7, c: 24, f: 0.3, unitScaled: true, label: 'fruit' },
    { keywords: ['filter coffee', 'coffee', 'chai', 'tea'], cals: 85, p: 2.5, c: 11, f: 3.2, unitScaled: true, label: 'chai/coffee' },
    { keywords: ['lassi'], cals: 210, p: 7, c: 31, f: 6.5, unitScaled: true, label: 'lassi' },
    { keywords: ['milk', 'shake', 'smoothie'], cals: 165, p: 8.2, c: 13, f: 8.0, unitScaled: false, label: 'milk' },
    { keywords: ['whey', 'protein scoop', 'protein shake'], cals: 130, p: 24, c: 3, f: 1.5, unitScaled: true, label: 'whey' },
    { keywords: ['peanut butter'], cals: 188, p: 8, c: 6, f: 16, unitScaled: true, label: 'peanut butter' },
    { keywords: ['peanuts', 'almonds', 'walnuts', 'cashews', 'nuts', 'chia', 'seeds'], cals: 175, p: 6, c: 6, f: 15, unitScaled: false, label: 'nuts/seeds' },
    { keywords: ['masala dosa'], cals: 280, p: 6.2, c: 42, f: 9.5, unitScaled: true, label: 'masala dosa' },
    { keywords: ['dosa', 'idli', 'uttapam', 'vada'], cals: 135, p: 3.8, c: 24, f: 2.6, unitScaled: true, label: 'dosa/idli' },
    { keywords: ['chutney'], cals: 90, p: 1.8, c: 5.5, f: 7.2, unitScaled: false, label: 'chutney' },
    { keywords: ['poha', 'upma', 'pongal'], cals: 240, p: 5.5, c: 41, f: 6.0, unitScaled: false, label: 'poha/upma' },
    { keywords: ['curd', 'yogurt', 'dahi', 'buttermilk', 'raita'], cals: 110, p: 6.5, c: 8, f: 5.0, unitScaled: false, label: 'curd' },
    { keywords: ['sandwich'], cals: 270, p: 10, c: 34, f: 10, unitScaled: true, label: 'sandwich' },
    { keywords: ['bread', 'toast', 'pav'], cals: 85, p: 2.8, c: 16, f: 1.1, unitScaled: true, label: 'bread' },
    { keywords: ['salad', 'sprouts', 'chana', 'chickpeas'], cals: 160, p: 9.5, c: 24, f: 2.5, unitScaled: false, label: 'sprouts/salad' },
    { keywords: ['samosa', 'kachori', 'pakora'], cals: 260, p: 4.5, c: 32, f: 13, unitScaled: true, label: 'samosa/snack' },
    { keywords: ['momos', 'dumplings'], cals: 260, p: 10, c: 36, f: 8, unitScaled: false, label: 'momos' },
    { keywords: ['maggi', 'noodles', 'pasta'], cals: 310, p: 7.5, c: 46, f: 11, unitScaled: false, label: 'noodles/pasta' },
    { keywords: ['shawarma', 'roll', 'kathi roll', 'wrap'], cals: 390, p: 20, c: 40, f: 16, unitScaled: true, label: 'roll/wrap' },
    { keywords: ['burger', 'pizza'], cals: 360, p: 14, c: 42, f: 15, unitScaled: true, label: 'burger/pizza' },
    { keywords: ['chocolate', 'gulab jamun', 'sweet', 'ice cream'], cals: 190, p: 3, c: 26, f: 8.5, unitScaled: true, label: 'sweet/dessert' },
  ];

  // Convert spoken number words into digits so "two eggs and one banana" scales properly
  const wordNumbers: Record<string, string> = {
    half: '0.5',
    one: '1',
    a: '1',
    an: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
  };
  const normalizedForNumbers = lower.replace(
    /\b(half|one|two|three|four|five|six|seven|eight|nine|ten)\b/g,
    (m) => wordNumbers[m] || m
  );

  // Split multi-item meal descriptions by common connectors so each item gets its own quantity
  const segments = normalizedForNumbers
    .split(/\s*(?:,|&|\band\b|\bwith\b|\bplus\b|\+)\s*/i)
    .filter(Boolean);

  let totalCals = 0;
  let totalP = 0;
  let totalC = 0;
  let totalF = 0;
  const matchedLabels: string[] = [];

  for (const seg of segments) {
    const segNumMatch = seg.match(
      /(\d+(?:\.\d+)?)\s*(g|gm|grams|ml|kg|cup|cups|bowl|bowls|katori|plate|plates|tbsp|tablespoon|tablespoons|tsp|scoop|scoops|slice|slices|piece|pieces|glass|glasses)?/
    );
    const rawQty = segNumMatch ? parseFloat(segNumMatch[1]) : 1;
    const unit = segNumMatch?.[2] || '';
    const isGramsOrMl = unit === 'g' || unit === 'gm' || unit === 'grams' || unit === 'ml';
    const isKg = unit === 'kg';

    for (const item of catalog) {
      if (item.keywords.some((kw) => seg.includes(kw))) {
        // Avoid double counting more specific compound dishes
        if (item.label === 'egg' && (seg.includes('egg white') || seg.includes('egg bhurji'))) continue;
        if (item.label === 'dosa/idli' && seg.includes('masala dosa')) continue;
        if (item.label === 'paneer' && (seg.includes('paneer tikka') || seg.includes('paneer bhurji') || seg.includes('kadai paneer') || seg.includes('palak paneer'))) continue;
        if (item.label === 'chicken' && (seg.includes('butter chicken') || seg.includes('chicken curry'))) continue;
        if (item.label === 'rice' && seg.includes('fried rice')) continue;
        if (item.label === 'paratha' && (seg.includes('aloo paratha') || seg.includes('gobi paratha') || seg.includes('paneer paratha'))) continue;
        if (item.label === 'dal/legumes' && seg.includes('dal makhani')) continue;

        let scale = 1;
        if (isKg) {
          scale = Math.min(20, rawQty * 10);
        } else if (isGramsOrMl || rawQty >= 25) {
          scale = Math.min(15, rawQty / 100);
        } else if (unit === 'tbsp' || unit === 'tablespoon' || unit === 'tablespoons') {
          scale = Math.min(8, rawQty * 0.5);
        } else if (unit === 'tsp') {
          scale = Math.min(8, rawQty * 0.2);
        } else if (unit === 'plate' || unit === 'plates') {
          scale = Math.min(6, rawQty * 1.3);
        } else if (item.unitScaled) {
          scale = Math.min(20, rawQty);
        } else {
          scale = Math.min(6, rawQty);
        }

        totalCals += item.cals * scale;
        totalP += item.p * scale;
        totalC += item.c * scale;
        totalF += item.f * scale;
        matchedLabels.push(`${item.label} (${Math.round(item.cals * scale)} kcal)`);
        break;
      }
    }
  }

  if (matchedLabels.length === 0) {
    const numMatch = normalizedForNumbers.match(/(\d+(?:\.\d+)?)/);
    const qty = numMatch ? Math.min(6, Math.max(1, parseFloat(numMatch[1]))) : 1;
    totalCals = 250 * qty;
    totalP = 10 * qty;
    totalC = 34 * qty;
    totalF = 8 * qty;
  }

  return {
    name: cleanName,
    calories: Math.round(totalCals),
    protein: Math.round(totalP),
    carbs: Math.round(totalC),
    fat: Math.round(totalF),
    breakdown:
      matchedLabels.length > 0
        ? matchedLabels.join(' + ')
        : 'Standard serving estimate',
  };
}

/**
 * System prompt for real-time AI food macro & calorie calculation.
 */
export function buildFoodNutritionPrompt(): string {
  return `You are a precision sports nutritionist and real-time calorie/macro calculator AI.
Given any spoken or typed meal description (Indian home meals, restaurant food, snacks, drinks, weights like "150g chicken", bowls, plates, spoons, or casual speech like "I had two masala dosas and filter coffee"), accurately compute the total Calories (kcal), Protein (g), Carbs (g), and Fat (g) using realistic USDA / IFCT Indian nutrition values.
Respond ONLY with a valid JSON object (no markdown fences, no extra text) in this exact schema:
{"name":"<clean capitalized meal name>","calories":<integer>,"protein":<integer>,"carbs":<integer>,"fat":<integer>,"breakdown":"<short 1-line item-by-item calories & macros breakdown>"}`;
}

/**
 * Safely parses AI food macro JSON output, with fallback to estimateFoodMacros.
 */
export function parseAiFoodNutrition(
  rawReply: string,
  fallbackInput: string,
  isLiveModel = true
): {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  breakdown: string;
  aiAnalyzed: boolean;
} {
  const fallback = estimateFoodMacros(fallbackInput);
  if (!rawReply || typeof rawReply !== 'string') {
    return { ...fallback, aiAnalyzed: false };
  }

  try {
    const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { ...fallback, aiAnalyzed: false };
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const calories = Number(parsed.calories);
    const protein = Number(parsed.protein);
    const carbs = Number(parsed.carbs);
    const fat = Number(parsed.fat);

    if (
      !Number.isFinite(calories) ||
      !Number.isFinite(protein) ||
      !Number.isFinite(carbs) ||
      !Number.isFinite(fat)
    ) {
      return { ...fallback, aiAnalyzed: false };
    }

    return {
      name: String(parsed.name || fallback.name).trim(),
      calories: Math.max(0, Math.round(calories)),
      protein: Math.max(0, Math.round(protein)),
      carbs: Math.max(0, Math.round(carbs)),
      fat: Math.max(0, Math.round(fat)),
      breakdown: String(parsed.breakdown || '').trim() || 'AI nutrition analysis',
      aiAnalyzed: Boolean(isLiveModel),
    };
  } catch {
    return { ...fallback, aiAnalyzed: false };
  }
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

  const clarityFormatRule = `STYLE RULES (STRICT): Use simple, clear words anyone can understand. Remove ALL unnecessary filler, small talk, and long paragraphs. Arrange your reply cleanly using:
- A short bold heading (e.g. **Today's Plan**)
- Short numbered steps (1., 2., 3.) or bullet points (- ) with 1 short sentence per line.`;

  if (companion === 'calm') {
    return `You are Calm, a warm companion for a JEE student named ${name} (${studentClass}) aiming for: ${goal} (JEE ${examYear}). ${backlogDirective} Main struggle: ${struggle}. Job: stress relief only. Validate feelings in 1 short sentence, then give ONE simple reset (breathing, 5-min break, or grounding). Keep under 90 words. No study plans. Use simple, gentle words with clear bullet steps. If self-harm or hopelessness appears, respond with care and share India's Tele-MANAS helpline 14416 (24x7, free).`;
  }

  if (companion === 'now') {
    return `You are Now, a direct study coach for ${name} (${studentClass}) aiming for ${goal} (JEE ${examYear}, struggle: ${struggle}, daily study target: ${studyPlan.formattedTodayTarget}). ${backlogDirective} Reply with ONLY 3 short, plain-English lines (no extra words):
ACTION: <1 clear task to start right now>
WHY: <1 simple reason why>
TIME: <minutes>
Match difficulty to energy: low = quick formula/NCERT revision; high = ${hasBacklog ? `1 pending backlog chapter (${pendingChapters} left before ${syllabusDeadline})` : 'hard JEE Advanced problems'}.`;
  }

  if (companion === 'motivation') {
    return `You are Motivation (Mitra), a warm friend, clear teacher, and guide for ${name} (${studentClass}) aiming for "${goal}" (JEE ${examYear}, struggles: ${struggle}). ${backlogDirective} Daily study goal: ${studyPlan.formattedTodayTarget}. Speak in simple, direct, heartfelt words—no long lectures or filler. Arrange advice cleanly with a short bold title and 2–3 short bullet points. Under 110 words. If severe distress is mentioned, share India's Tele-MANAS helpline 14416 (24x7, free).`;
  }

  if (companion === 'workout') {
    const bmiInfo = calculateBmiAndMacros({
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      workoutHours: profile.workoutHours,
      bodyGoal: profile.bodyGoal,
    });
    return `You are the LAKSHYA Bodyweight Fitness & Nutrition AI Coach for ${name} (${studentClass}).
Profile: Body Goal = "${profile.bodyGoal || 'Lean & Athletic'}", Workout Cap = ${profile.workoutHours || 1} hour(s)/day (max 2h so JEE study stays protected), Weight = ${profile.weightKg || 62}kg, Height = ${profile.heightCm || 172}cm, BMI = ${bmiInfo.bmi} (${bmiInfo.bmiCategory}), Daily Macros = ${bmiInfo.dailyCalories} kcal (${bmiInfo.dailyProteinG}g Protein, ${bmiInfo.dailyCarbsG}g Carbs, ${bmiInfo.dailyFatG}g Fat).
Rules: Recommend ONLY 100% bodyweight exercises (no gym machines/weights). ${clarityFormatRule}
Format every workout or diet reply cleanly as:
**Goal Focus:** (1 short line)
**Workout / Meal Steps:**
1. (Exercise/Food — exact sets × reps or portion)
2. ...
**Coach Tip:** (1 short line). No fluff or long intros.`;
  }

  if (companion === 'skills') {
    const skillNames =
      profile.skills && profile.skills.length > 0
        ? profile.skills.map((s) => s.name).join(', ')
        : 'Python, AI & Video Editing';
    return `You are the LAKSHYA Skills AI Mentor for ${name} (${studentClass}), learning: ${skillNames} alongside JEE prep (${goal}, ${studyPlan.formattedTodayTarget}/day).
${clarityFormatRule}
Keep sessions to 20–30 minutes. Never write long essays or fancy jargon. Format every answer cleanly as:
**Skill Focus:** (1 short line)
**Today's 25-Min Steps:**
1. (10 min — simple concept + clear example)
2. (15 min — small hands-on task to build/edit)
3. (Stop & return to JEE)
**Next Step:** (1 short question).`;
  }

  return `You are Mission, a direct mentor keeping ${name} (${studentClass}) focused on: ${goal} (JEE ${examYear}, struggles: ${struggle}, daily study target: ${studyPlan.formattedTodayTarget}). ${backlogDirective}
${clarityFormatRule}
Remove all generic fluff and long intros. Keep replies under 120 words unless asked for a full weekly plan. Arrange every reply cleanly as:
**Mission Focus:** (1 short direct line)
**Action Plan:**
1. (Short concrete step)
2. (Short concrete step)
3. (Short concrete step)
**Check-In:** (1 short question).`;
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
