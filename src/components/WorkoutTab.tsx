import React, { useEffect, useRef, useState } from 'react';
import {
  Dumbbell,
  Flame,
  Scale,
  Utensils,
  Plus,
  Trash2,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Sparkles,
  Loader2,
  Mic,
  MicOff,
} from 'lucide-react';
import {
  BodyGoalType,
  ChatMessage,
  CompanionId,
  FoodLogEntry,
  UserProfile,
  buildCompanionSystemPrompt,
  buildFoodNutritionPrompt,
  calculateBmiAndMacros,
  parseAiFoodNutrition,
  toLocalDateKey,
} from '../utils/lakshyaLogic';
import { callGrok } from '../api/grok';
import { ChatScreen } from './ChatScreen';

interface WorkoutTabProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  messages: ChatMessage[];
  onUpdateMessages: (companion: CompanionId, msgs: ChatMessage[]) => void;
  onClearChat: (companion: CompanionId) => void;
}

const BODY_GOALS: {
  id: BodyGoalType;
  label: string;
  desc: string;
}[] = [
  {
    id: 'Lean & Athletic',
    label: 'Lean & Athletic',
    desc: 'Sharp definition, speed & high desk energy',
  },
  {
    id: 'Calisthenics & Muscular',
    label: 'Calisthenics & Muscular',
    desc: 'Upper-body strength with push-ups, dips & pull-ups',
  },
  {
    id: 'Core & Study Stamina',
    label: 'Core & Study Stamina',
    desc: 'Bulletproof posture & back strength for 10h study days',
  },
  {
    id: 'Fat Loss & Toned',
    label: 'Fat Loss & Toned',
    desc: 'High-burn bodyweight HIIT circuits & conditioning',
  },
];

const QUICK_FOOD_EXAMPLES = [
  '2 boiled eggs and oats',
  'Paneer 100g and 2 rotis',
  'Dal rice and curd',
  '1 banana and peanut butter toast',
  'Chicken breast 150g and salad',
  '1 glass milk and almonds',
];

const BODYWEIGHT_SCHEDULES: Record<
  BodyGoalType,
  { name: string; sets: string; focus: string }[]
> = {
  'Lean & Athletic': [
    { name: 'Standard & Wide Push-Ups', sets: '4 sets × 15 reps', focus: 'Chest & Triceps' },
    { name: 'Bodyweight Squats + Jump Squats', sets: '4 sets × 20 reps', focus: 'Quads & Explosiveness' },
    { name: 'Alternating Reverse Lunges', sets: '3 sets × 14 reps/leg', focus: 'Leg Balance' },
    { name: 'Plank to Shoulder Taps', sets: '3 sets × 45 sec', focus: 'Core Stability' },
    { name: 'Mountain Climbers + Burpees', sets: '3 sets × 40 sec', focus: 'Cardio & Brain Oxygen' },
  ],
  'Calisthenics & Muscular': [
    { name: 'Diamond & Decline Push-Ups', sets: '4 sets × 12 reps', focus: 'Upper Chest & Triceps' },
    { name: 'Pike Push-Ups (Shoulder Press)', sets: '4 sets × 10 reps', focus: 'Deltoids' },
    { name: 'Bulgarian Split Squats (Chair/Bed)', sets: '4 sets × 12 reps/leg', focus: 'Single-Leg Hypertrophy' },
    { name: 'Chair / Bed Tricep Dips', sets: '4 sets × 15 reps', focus: 'Arms & Lockout' },
    { name: 'Hollow Body Core Hold', sets: '4 sets × 40 sec', focus: 'Calisthenics Core' },
  ],
  'Core & Study Stamina': [
    { name: 'Thoracic Spine & Neck Desk Mobility', sets: '2 sets × 3 mins', focus: 'Posture Reset' },
    { name: 'Incline / Standard Push-Ups', sets: '3 sets × 15 reps', focus: 'Upper Body Bloodflow' },
    { name: 'Superman Back Extensions', sets: '4 sets × 15 reps', focus: 'Lower Back Endurance' },
    { name: 'Forearm Plank + Side Plank', sets: '3 sets × 60 sec', focus: 'Spinal Support' },
    { name: 'Deep Bodyweight Squats + Calf Raises', sets: '3 sets × 20 reps', focus: 'Circulation' },
  ],
  'Fat Loss & Toned': [
    { name: 'High-Knee Sprints in Place', sets: '4 sets × 45 sec', focus: 'Calorie Burn' },
    { name: 'Full Bodyweight Burpees', sets: '4 sets × 12 reps', focus: 'Full-Body Conditioning' },
    { name: 'Push-Ups to Mountain Climbers', sets: '4 sets × 12 reps', focus: 'Metabolic Upper Body' },
    { name: 'Sumo Squats + Alternating Lunges', sets: '4 sets × 20 reps', focus: 'Lower Body Toning' },
    { name: 'Bicycle Crunches + Plank Hold', sets: '4 sets × 45 sec', focus: 'Core Definition' },
  ],
};

export const WorkoutTab: React.FC<WorkoutTabProps> = ({
  profile,
  onUpdateProfile,
  messages,
  onUpdateMessages,
  onClearChat,
}) => {
  const todayKey = toLocalDateKey(new Date());
  const [weightInput, setWeightInput] = useState<number>(
    profile.weightKg || 62
  );
  const [heightInput, setHeightInput] = useState<number>(
    profile.heightCm || 172
  );
  const [foodText, setFoodText] = useState('');
  const [isAnalyzingFood, setIsAnalyzingFood] = useState(false);
  const [liveFoodPreview, setLiveFoodPreview] = useState<{
    query: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    breakdown: string;
    aiAnalyzed: boolean;
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const previewReqIdRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const [workoutWarning, setWorkoutWarning] = useState('');
  const [completedDrills, setCompletedDrills] = useState<Record<number, boolean>>(
    {}
  );

  const activeBodyGoal: BodyGoalType = profile.bodyGoal || 'Lean & Athletic';
  const activeWorkoutHours: 1 | 2 = profile.workoutHours === 2 ? 2 : 1;
  const isRestingToday = Boolean(profile.restDays?.includes(todayKey));

  const bmiMacros = calculateBmiAndMacros({
    weightKg: weightInput,
    heightCm: heightInput,
    workoutHours: activeWorkoutHours,
    bodyGoal: activeBodyGoal,
  });

  const todayFoods = (profile.foodLog || []).filter((f) => f.date === todayKey);
  const consumedTotals = todayFoods.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const analyzeFoodWithAi = async (query: string) => {
    const res = await callGrok({
      companion: 'workout',
      profile,
      purpose: 'food-macros',
      temperature: 0.1,
      stream: false,
      systemPrompt: buildFoodNutritionPrompt(),
      messages: [
        {
          role: 'user',
          content: `Calculate accurate calories, protein (g), carbs (g), and fat (g) for: "${query}"`,
        },
      ],
    });
    return parseAiFoodNutrition(res.reply, query, !res.demoMode);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const handleToggleVoiceFood = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      setIsListening(false);
      return;
    }

    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      setVoiceNotice(
        'Voice mic is not supported in this browser—type your meal above and AI will calculate it live.'
      );
      return;
    }

    setVoiceNotice('');
    try {
      const recognition = new SpeechRec();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0]?.transcript || '')
          .join(' ')
          .trim();
        if (transcript) {
          setFoodText(transcript);
        }
      };
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event?.error === 'not-allowed') {
          setVoiceNotice(
            'Microphone access blocked—allow mic permission or type your food above.'
          );
        } else {
          setVoiceNotice(
            'Could not hear clearly—try speaking again or type your meal above.'
          );
        }
      };
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceNotice(
        'Could not start voice input—type your meal above for live AI macro calculation.'
      );
    }
  };

  // Real-time debounced AI nutrition preview as the user speaks or types what they ate
  useEffect(() => {
    const trimmed = foodText.trim();
    if (trimmed.length < 3) {
      setLiveFoodPreview(null);
      setIsPreviewLoading(false);
      return;
    }

    const reqId = ++previewReqIdRef.current;
    setIsPreviewLoading(true);
    const timer = setTimeout(async () => {
      try {
        const parsed = await analyzeFoodWithAi(trimmed);
        if (previewReqIdRef.current === reqId) {
          setLiveFoodPreview({ query: trimmed, ...parsed });
        }
      } catch {
        // Fallback already handled inside parseAiFoodNutrition
      } finally {
        if (previewReqIdRef.current === reqId) {
          setIsPreviewLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [foodText]);

  const handleSaveBiometrics = (
    newWeight: number,
    newHeight: number,
    newBodyGoal: BodyGoalType = activeBodyGoal,
    newWorkoutHours: 1 | 2 = activeWorkoutHours
  ) => {
    onUpdateProfile({
      ...profile,
      weightKg: newWeight,
      heightCm: newHeight,
      bodyGoal: newBodyGoal,
      workoutHours: newWorkoutHours,
    });
  };

  const handleToggleRestToday = () => {
    const currentRestDays = profile.restDays || [];
    const updatedRestDays = isRestingToday
      ? currentRestDays.filter((d) => d !== todayKey)
      : [...currentRestDays, todayKey];
    onUpdateProfile({
      ...profile,
      restDays: updatedRestDays,
    });
  };

  const handleAddFood = async (foodNameToLog: string) => {
    const trimmed = foodNameToLog.trim();
    if (!trimmed || isAnalyzingFood) return;

    setIsAnalyzingFood(true);
    try {
      const result =
        liveFoodPreview &&
        liveFoodPreview.query.toLowerCase() === trimmed.toLowerCase()
          ? liveFoodPreview
          : await analyzeFoodWithAi(trimmed);

      const newEntry: FoodLogEntry = {
        id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        breakdown: result.breakdown,
        aiAnalyzed: result.aiAnalyzed,
        date: todayKey,
      };
      onUpdateProfile({
        ...profile,
        foodLog: [...(profile.foodLog || []), newEntry],
      });
      setFoodText('');
      setLiveFoodPreview(null);
    } finally {
      setIsAnalyzingFood(false);
    }
  };

  const handleDeleteFood = (id: string) => {
    onUpdateProfile({
      ...profile,
      foodLog: (profile.foodLog || []).filter((f) => f.id !== id),
    });
  };

  const dailySchedule = BODYWEIGHT_SCHEDULES[activeBodyGoal];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header: What Type of Body Do You Want to Build + 1h/2h Workout Cap */}
      <div className="orbital-glass-cyan rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#22D3EE]">
              <Dumbbell className="w-4 h-4" />
              <span>100% Bodyweight Fitness &amp; BMI Nutrition Lab</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-0.5">
              Workout &amp; Nutrition Coach
            </h1>
            <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1">
              Zero gym equipment needed—pure bodyweight workouts, BMI-based macro targets, and daily recovery built for JEE aspirants.
            </p>
          </div>

          <button
            type="button"
            data-testid="take-rest-today-btn"
            onClick={handleToggleRestToday}
            className={`min-h-[46px] px-5 py-2.5 rounded-full font-display font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
              isRestingToday
                ? 'bg-[#FFB020] text-[#0A0E1F] border-[#FFB020] shadow-[0_0_20px_rgba(255,176,32,0.4)]'
                : 'bg-[#131938] hover:bg-[#1d2552] text-[#CBD5E1] border-[#2A3362]'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>
              {isRestingToday
                ? 'Resting Today (Click to Resume Workout)'
                : 'Take Rest Today'}
            </span>
          </button>
        </div>

        {/* Question: What type of body do you want to build? */}
        <div className="space-y-2.5">
          <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#94A3B8] block">
            What Type of Body Do You Want to Build? (Bodyweight Only)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {BODY_GOALS.map((bg) => {
              const active = activeBodyGoal === bg.id;
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() =>
                    handleSaveBiometrics(
                      weightInput,
                      heightInput,
                      bg.id,
                      activeWorkoutHours
                    )
                  }
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#22D3EE]/18 border-[#22D3EE] text-white shadow-[0_0_18px_rgba(34,211,238,0.2)]'
                      : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#22D3EE]/40'
                  }`}
                >
                  <div className="font-display font-bold text-xs text-white flex items-center justify-between">
                    <span>{bg.label}</span>
                    {active && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-1">{bg.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workout Duration Selector: 1 Hour or 2 Hours only (More than 2h -> NEED time to study) */}
        <div className="pt-2 border-t border-[#2A3362]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-display font-semibold text-[#CBD5E1]">
            Daily Workout Duration (Capped so you have time for JEE study):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setWorkoutWarning('');
                handleSaveBiometrics(weightInput, heightInput, activeBodyGoal, 1);
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded-xl font-display font-bold text-xs border cursor-pointer ${
                activeWorkoutHours === 1
                  ? 'bg-[#22D3EE] text-[#001f25] border-[#22D3EE]'
                  : 'bg-[#0A0E1F]/80 text-[#CBD5E1] border-[#2A3362]'
              }`}
            >
              1 Hour
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkoutWarning('');
                handleSaveBiometrics(weightInput, heightInput, activeBodyGoal, 2);
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded-xl font-display font-bold text-xs border cursor-pointer ${
                activeWorkoutHours === 2
                  ? 'bg-[#22D3EE] text-[#001f25] border-[#22D3EE]'
                  : 'bg-[#0A0E1F]/80 text-[#CBD5E1] border-[#2A3362]'
              }`}
            >
              2 Hours
            </button>
            <button
              type="button"
              onClick={() =>
                setWorkoutWarning(
                  'Hold on! You NEED time to study for JEE! Maximum workout allowed is 1 or 2 hours.'
                )
              }
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl font-display font-semibold text-xs border bg-[#0A0E1F]/50 border-[#2A3362] text-[#94A3B8] hover:text-[#ffb4ab] cursor-pointer"
            >
              More than 2 Hours?
            </button>
          </div>
        </div>

        {workoutWarning && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-[#93000a]/40 border border-[#ffb4ab]/50 text-xs text-[#ffdad6] flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-[#ffb4ab] shrink-0" />
            <span>{workoutWarning}</span>
          </div>
        )}
      </div>

      {/* Row 2: Weight, Height, BMI & Daily Macro Targets + Food Nutrition Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Weight, Height, BMI & Daily Macro Targets */}
        <div className="lg:col-span-5 orbital-glass-1 rounded-3xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#22D3EE]">
                <Scale className="w-4 h-4" />
                <span>Weight, Height &amp; BMI Macros</span>
              </div>
              <span
                data-testid="bmi-badge"
                className="px-3 py-1 rounded-full bg-[#22D3EE]/15 border border-[#22D3EE]/40 text-xs font-mono-num font-bold text-[#22D3EE]"
              >
                BMI {bmiMacros.bmi} · {bmiMacros.bmiCategory}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="workout-weight-input"
                  className="block text-[11px] font-display uppercase tracking-wider text-[#94A3B8] mb-1"
                >
                  Weight (kg)
                </label>
                <input
                  id="workout-weight-input"
                  type="number"
                  min={30}
                  max={180}
                  value={weightInput}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 60;
                    setWeightInput(val);
                    handleSaveBiometrics(
                      val,
                      heightInput,
                      activeBodyGoal,
                      activeWorkoutHours
                    );
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0A0E1F] border border-[#2A3362] focus:border-[#22D3EE] focus:outline-none text-sm text-white font-mono-num font-bold"
                />
              </div>

              <div>
                <label
                  htmlFor="workout-height-input"
                  className="block text-[11px] font-display uppercase tracking-wider text-[#94A3B8] mb-1"
                >
                  Height (cm)
                </label>
                <input
                  id="workout-height-input"
                  type="number"
                  min={120}
                  max={220}
                  value={heightInput}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 170;
                    setHeightInput(val);
                    handleSaveBiometrics(
                      weightInput,
                      val,
                      activeBodyGoal,
                      activeWorkoutHours
                    );
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0A0E1F] border border-[#2A3362] focus:border-[#22D3EE] focus:outline-none text-sm text-white font-mono-num font-bold"
                />
              </div>
            </div>

            {/* Daily Macro Progress vs BMI Need */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-display font-semibold text-[#CBD5E1]">
                Daily Nutritional Need (According to BMI {bmiMacros.bmi}):
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#0A0E1F]/80 border border-[#2A3362]">
                  <div className="text-[11px] text-[#94A3B8]">Calories</div>
                  <div
                    data-testid="calories-progress"
                    className="text-base font-display font-bold font-mono-num text-white mt-0.5"
                  >
                    {consumedTotals.calories} / {bmiMacros.dailyCalories} kcal
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0A0E1F]/80 border border-[#2A3362]">
                  <div className="text-[11px] text-[#22D3EE]">Protein</div>
                  <div
                    data-testid="protein-progress"
                    className="text-base font-display font-bold font-mono-num text-white mt-0.5"
                  >
                    {consumedTotals.protein}g / {bmiMacros.dailyProteinG}g
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0A0E1F]/80 border border-[#2A3362]">
                  <div className="text-[11px] text-[#FFB020]">Carbs</div>
                  <div className="text-base font-display font-bold font-mono-num text-white mt-0.5">
                    {consumedTotals.carbs}g / {bmiMacros.dailyCarbsG}g
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0A0E1F]/80 border border-[#2A3362]">
                  <div className="text-[11px] text-[#F472B6]">Healthy Fats</div>
                  <div className="text-base font-display font-bold font-mono-num text-white mt-0.5">
                    {consumedTotals.fat}g / {bmiMacros.dailyFatG}g
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#94A3B8] border-t border-[#2A3362]/70 pt-3">
            Target tuned for {activeBodyGoal} ({activeWorkoutHours}h daily bodyweight training).
          </div>
        </div>

        {/* Right: Food Intake Log & Real-Time AI Calorie/Protein/Carb/Fat Analyzer */}
        <div className="lg:col-span-7 orbital-glass-1 rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#FFB020]">
                <Utensils className="w-4 h-4" />
                <span>Real-Time AI Food &amp; Macro Tracker (Today)</span>
              </div>
              <span className="text-xs font-mono-num text-[#94A3B8]">
                {todayFoods.length} items logged today
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddFood(foodText);
              }}
              className="flex gap-2"
            >
              <label htmlFor="food-log-input" className="sr-only">
                Say or type the food you ate
              </label>
              <input
                id="food-log-input"
                type="text"
                value={foodText}
                onChange={(e) => {
                  setFoodText(e.target.value);
                  if (voiceNotice) setVoiceNotice('');
                }}
                placeholder={
                  isListening
                    ? 'Listening... speak your meal now (e.g., 2 masala dosas and coffee)'
                    : 'Say or type any meal (e.g., 2 masala dosas with chutney, 150g chicken & rice)...'
                }
                className="flex-1 h-11 px-4 rounded-xl bg-[#0A0E1F] border border-[#2A3362] focus:border-[#FFB020] focus:outline-none text-xs sm:text-sm text-white placeholder-[#64748B]"
              />
              <button
                type="button"
                onClick={handleToggleVoiceFood}
                data-testid="voice-food-btn"
                aria-label={isListening ? 'Stop voice food input' : 'Speak food name'}
                aria-pressed={isListening}
                title={isListening ? 'Stop listening' : 'Speak what you ate'}
                className={`min-h-[44px] px-3.5 rounded-xl border font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
                  isListening
                    ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#fca5a5] animate-pulse'
                    : 'bg-[#131938] hover:bg-[#1d2552] border-[#2A3362] text-[#22D3EE]'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span className="hidden sm:inline">Speak</span>
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={isAnalyzingFood || !foodText.trim()}
                data-testid="add-food-btn"
                className="min-h-[44px] px-5 rounded-xl bg-gradient-to-r from-[#FFB020] to-[#F59E0B] text-[#0A0E1F] font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isAnalyzingFood ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Food</span>
                  </>
                )}
              </button>
            </form>

            {voiceNotice && (
              <p className="text-[11px] text-[#FFB020] px-1">{voiceNotice}</p>
            )}

            {/* Real-Time AI Nutrition Preview as user speaks or types */}
            {(isPreviewLoading || liveFoodPreview) && foodText.trim().length >= 3 && (
              <div
                data-testid="live-ai-food-preview"
                className="p-3.5 rounded-2xl bg-[#0A0E1F]/90 border border-[#FFB020]/45 space-y-2.5"
              >
                {isPreviewLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#FFB020]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI calculating live calories, protein, carbs &amp; fats...</span>
                  </div>
                ) : liveFoodPreview ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-display font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#FFB020]" />
                        <span>{liveFoodPreview.name}</span>
                      </span>
                      <span className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                        {liveFoodPreview.aiAnalyzed ? 'Live AI Verified' : 'Smart Estimate'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 font-mono-num text-center">
                      <div className="p-2 rounded-xl bg-[#131938]/90 border border-[#2A3362]">
                        <div className="text-[10px] text-[#94A3B8]">Calories</div>
                        <div className="text-xs sm:text-sm font-bold text-[#FFB020]">
                          {liveFoodPreview.calories} kcal
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#131938]/90 border border-[#2A3362]">
                        <div className="text-[10px] text-[#94A3B8]">Protein</div>
                        <div className="text-xs sm:text-sm font-bold text-[#22D3EE]">
                          {liveFoodPreview.protein}g
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#131938]/90 border border-[#2A3362]">
                        <div className="text-[10px] text-[#94A3B8]">Carbs</div>
                        <div className="text-xs sm:text-sm font-bold text-[#dee1fa]">
                          {liveFoodPreview.carbs}g
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#131938]/90 border border-[#2A3362]">
                        <div className="text-[10px] text-[#94A3B8]">Fats</div>
                        <div className="text-xs sm:text-sm font-bold text-[#F472B6]">
                          {liveFoodPreview.fat}g
                        </div>
                      </div>
                    </div>
                    {liveFoodPreview.breakdown && (
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                        {liveFoodPreview.breakdown}
                      </p>
                    )}
                  </>
                ) : null}
              </div>
            )}

            {/* Quick Tap Food Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FOOD_EXAMPLES.map((foodChip) => (
                <button
                  key={foodChip}
                  type="button"
                  disabled={isAnalyzingFood}
                  onClick={() => handleAddFood(foodChip)}
                  className="px-3 py-1.5 rounded-full bg-[#131938] hover:bg-[#1d2552] border border-[#2A3362] text-[11px] text-[#CBD5E1] cursor-pointer transition-colors disabled:opacity-50"
                >
                  + {foodChip}
                </button>
              ))}
            </div>

            {/* Logged Foods List */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {todayFoods.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#0A0E1F]/60 border border-[#2A3362]/70 text-xs text-[#94A3B8] text-center">
                  No food logged yet today. Speak or type any dish above—our real-time AI calculates its exact calories, protein, carbs, and fats instantly!
                </div>
              ) : (
                todayFoods.map((item) => (
                  <div
                    key={item.id}
                    data-testid="logged-food-item"
                    className="p-3 rounded-xl bg-[#0A0E1F]/80 border border-[#2A3362] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-display font-semibold text-white">
                          {item.name}
                        </span>
                        {item.aiAnalyzed && (
                          <span className="text-[10px] font-display font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                            AI Verified
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono-num text-[#94A3B8] flex flex-wrap gap-3 mt-0.5">
                        <span className="text-[#FFB020] font-semibold">
                          {item.calories} kcal
                        </span>
                        <span className="text-[#22D3EE]">
                          Protein: {item.protein}g
                        </span>
                        <span>Carbs: {item.carbs}g</span>
                        <span className="text-[#F472B6]">Fat: {item.fat}g</span>
                      </div>
                      {item.breakdown && (
                        <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                          {item.breakdown}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFood(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="p-2 rounded-lg text-[#94A3B8] hover:text-[#ffb4ab] cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Daily Bodyweight Workout Schedule (or Rest Day State) */}
      <div className="orbital-glass-2 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#22D3EE]" />
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-white">
                Today’s Bodyweight Workout Schedule ({activeBodyGoal} ·{' '}
                {activeWorkoutHours} Hr)
              </h2>
              <p className="text-xs text-[#94A3B8]">
                100% Bodyweight Calisthenics — zero equipment required.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleRestToday}
            className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#0A0E1F] hover:bg-[#131938] border border-[#2A3362] text-xs font-display font-semibold text-[#FFB020] cursor-pointer"
          >
            {isRestingToday ? 'Switch Back to Active Workout' : 'Take Rest Today'}
          </button>
        </div>

        {isRestingToday ? (
          <div
            data-testid="rest-day-active-banner"
            className="p-6 rounded-2xl bg-[#FFB020]/15 border border-[#FFB020]/50 space-y-2 text-center"
          >
            <div className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#FFB020]">
              <Sparkles className="w-4 h-4" />
              <span>Rest &amp; Muscle Recovery Day Active ({todayKey})</span>
            </div>
            <h3 className="text-lg font-display font-bold text-white">
              Enjoy your rest day, {profile.name}!
            </h3>
            <p className="text-xs sm:text-sm text-[#dee1fa] max-w-xl mx-auto leading-relaxed">
              Your muscles grow and your brain consolidates JEE concepts during recovery. Do 5 minutes of light neck/shoulder stretching, hit your{' '}
              <strong>{bmiMacros.dailyProteinG}g protein target</strong>, and channel your extra energy into your study blocks today.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {dailySchedule.map((drill, idx) => {
              const done = Boolean(completedDrills[idx]);
              return (
                <button
                  key={drill.name}
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  onClick={() =>
                    setCompletedDrills((prev) => ({
                      ...prev,
                      [idx]: !prev[idx],
                    }))
                  }
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    done
                      ? 'bg-[#22D3EE]/15 border-[#22D3EE] text-white'
                      : 'bg-[#0A0E1F]/80 border-[#2A3362] hover:border-[#22D3EE]/50 text-[#dee1fa]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono-num text-[#22D3EE]">
                      <span>Drill 0{idx + 1}</span>
                      <span>{done ? 'Done ✓' : drill.focus}</span>
                    </div>
                    <div
                      className={`font-display font-bold text-xs sm:text-sm ${
                        done ? 'line-through text-[#CBD5E1]' : 'text-white'
                      }`}
                    >
                      {drill.name}
                    </div>
                  </div>
                  <div className="text-xs font-mono-num text-[#FFB020] pt-2 border-t border-[#2A3362]/70">
                    {drill.sets}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 4: Bodyweight Workout AI Coach Chat */}
      <ChatScreen
        companion="workout"
        color="cyan"
        title="Bodyweight Workout AI Coach"
        subtitle={`Ask your AI Coach for bodyweight-only routines, calisthenics progressions for "${activeBodyGoal}", posture fixes for long study hours, or high-protein student meals.`}
        systemPrompt={buildCompanionSystemPrompt('workout', profile)}
        profile={profile}
        messages={messages}
        onUpdateMessages={onUpdateMessages}
        onClearChat={onClearChat}
      />
    </div>
  );
};
