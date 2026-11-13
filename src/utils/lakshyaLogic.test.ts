import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUpdatedStreak,
  calculateDaysToExam,
  buildCompanionSystemPrompt,
  parseNowAction,
  containsSevereDistress,
  canUnlockStage,
  isStageComplete,
  formatStrugglesList,
  formatSyllabusTarget,
  calculateDailyStudyPlan,
  calculateBmiAndMacros,
  estimateFoodMacros,
  parseAiFoodNutrition,
  UserProfile,
} from './lakshyaLogic';
import { generateDemoReply } from '../../api/grok.js';

const baseProfile: UserProfile = {
  name: 'Aarav',
  goal: 'AIR under 500 in JEE Advanced — IIT Bombay CSE',
  examYear: '2027',
  struggle: 'Focus, Consistency',
  struggles: ['Focus', 'Consistency'],
  studentClass: 'Class 12',
  hasBacklog: true,
  pendingChapters: 9,
  syllabusTarget: {
    month: 'November',
    year: '2026',
    timing: 'End of the month',
  },
  currentStudyHours: 4,
  targetStudyHours: 10,
  workoutHours: 1,
  weightKg: 64,
  heightCm: 174,
  bodyGoal: 'Lean & Athletic',
  streak: 1,
  lastVisit: '2026-11-11T10:00:00.000Z',
  createdAt: '2026-11-11T10:00:00.000Z',
};

test('calculateUpdatedStreak keeps streak unchanged on same calendar day', () => {
  const sameDay = new Date('2026-11-11T18:30:00.000Z');
  const res = calculateUpdatedStreak(baseProfile, sameDay);
  assert.equal(res.streak, 1);
  assert.equal(res.changed, false);
});

test('calculateUpdatedStreak increments streak on next consecutive day', () => {
  const nextDay = new Date('2026-11-12T09:15:00.000Z');
  const res = calculateUpdatedStreak(baseProfile, nextDay);
  assert.equal(res.streak, 2);
  assert.equal(res.changed, true);
});

test('calculateUpdatedStreak resets streak to 1 when a day is missed', () => {
  const twoDaysLater = new Date('2026-11-14T09:15:00.000Z');
  const res = calculateUpdatedStreak(baseProfile, twoDaysLater);
  assert.equal(res.streak, 1);
  assert.equal(res.changed, true);
});

test('calculateDaysToExam returns positive days for target exam year', () => {
  const now = new Date('2026-11-12T12:00:00.000Z');
  const countdown = calculateDaysToExam('2027', now);
  assert.ok(countdown.daysRemaining > 60 && countdown.daysRemaining < 90);
  assert.match(countdown.targetLabel, /JEE 2027/);
});

test('formatStrugglesList and formatSyllabusTarget format multi-struggles and syllabus timing', () => {
  assert.equal(formatStrugglesList(['Focus', 'Backlog']), 'Focus, Backlog');
  assert.equal(
    formatSyllabusTarget({
      month: 'October',
      year: '2026',
      timing: 'Starting of the month',
    }),
    'Starting of the month · October 2026'
  );
});

test('calculateDailyStudyPlan adds +30 min extra per day when current study hours < target study hours', () => {
  const day1 = new Date('2026-11-11T12:00:00.000Z');
  const planDay1 = calculateDailyStudyPlan(baseProfile, day1);
  assert.equal(planDay1.isSteppedUp, true);
  assert.equal(planDay1.todayRecommendedHours, 4.5);
  assert.equal(planDay1.addedMinutesToday, 30);
  assert.equal(planDay1.formattedTodayTarget, '4 hrs 30 min');

  const day2 = new Date('2026-11-12T12:00:00.000Z');
  const planDay2 = calculateDailyStudyPlan(baseProfile, day2);
  assert.equal(planDay2.todayRecommendedHours, 5.0);
  assert.equal(planDay2.addedMinutesToday, 60);
});

test('calculateBmiAndMacros and estimateFoodMacros compute BMI, daily macros, and food nutrition', () => {
  const macros = calculateBmiAndMacros({
    weightKg: 64,
    heightCm: 174,
    workoutHours: 1,
    bodyGoal: 'Lean & Athletic',
  });
  assert.equal(macros.bmi, 21.1);
  assert.equal(macros.bmiCategory, 'Normal / Fit');
  assert.ok(macros.dailyCalories > 1800);
  assert.ok(macros.dailyProteinG >= 100);

  const eggFood = estimateFoodMacros('2 boiled eggs and 1 banana');
  assert.ok(eggFood.calories >= 240 && eggFood.calories <= 280);
  assert.ok(eggFood.protein >= 13);

  const spokenFood = estimateFoodMacros('I had two boiled eggs and one banana');
  assert.equal(spokenFood.name, 'two boiled eggs and one banana');
  assert.equal(spokenFood.calories, eggFood.calories);

  const aiParsed = parseAiFoodNutrition(
    '```json\n{"name":"Masala Dosa & Sambar","calories":410,"protein":11,"carbs":62,"fat":12,"breakdown":"1 masala dosa + 1 bowl sambar"}\n```',
    'masala dosa with sambar',
    true
  );
  assert.equal(aiParsed.aiAnalyzed, true);
  assert.equal(aiParsed.calories, 410);
  assert.equal(aiParsed.protein, 11);
  assert.equal(aiParsed.carbs, 62);
  assert.equal(aiParsed.fat, 12);

  const offlineParsed = parseAiFoodNutrition(
    '{"name":"Masala Dosa","calories":280,"protein":6,"carbs":42,"fat":10,"breakdown":"est"}',
    'masala dosa',
    false
  );
  assert.equal(offlineParsed.aiAnalyzed, false);
});

test('canUnlockStage enforces completing all Foundation tasks before unlocking Practice', () => {
  const incompleteProgress = {
    foundation: [true, true, false],
    practice: [false, false, false],
    mocks: [false, false, false],
    sprint: [false, false, false],
    jeeday: [false, false, false],
  };
  assert.equal(isStageComplete('foundation', incompleteProgress), false);
  assert.equal(canUnlockStage('foundation', incompleteProgress), true);
  assert.equal(canUnlockStage('practice', incompleteProgress), false);

  const completedFoundation = {
    ...incompleteProgress,
    foundation: [true, true, true],
  };
  assert.equal(isStageComplete('foundation', completedFoundation), true);
  assert.equal(canUnlockStage('practice', completedFoundation), true);
  assert.equal(canUnlockStage('mocks', completedFoundation), false);
});

test('buildCompanionSystemPrompt injects backlog focus, class, syllabus target, and workout/skills/mission clarity rules', () => {
  const calmPrompt = buildCompanionSystemPrompt('calm', baseProfile);
  assert.match(calmPrompt, /Aarav/);
  assert.match(calmPrompt, /9 chapters pending/);
  assert.match(calmPrompt, /End of the month · November 2026/);

  const workoutPrompt = buildCompanionSystemPrompt('workout', baseProfile);
  assert.match(workoutPrompt, /100% bodyweight/i);
  assert.match(workoutPrompt, /21\.1/);
  assert.match(workoutPrompt, /STYLE RULES/);

  const skillsPrompt = buildCompanionSystemPrompt('skills', baseProfile);
  assert.match(skillsPrompt, /STYLE RULES/);
  assert.match(skillsPrompt, /Today's 25-Min Steps/);

  const missionPrompt = buildCompanionSystemPrompt('mission', baseProfile);
  assert.match(missionPrompt, /STYLE RULES/);
  assert.match(missionPrompt, /Action Plan/);
});

test('parseNowAction extracts ACTION, WHY, and TIME accurately including parenthetical labels', () => {
  const raw = `ACTION (one line): Solve 12 Rotational Motion PYQs (2021-2023) with a strict stopwatch.
WHY (one line): High energy is best spent conquering heavy mechanics problems that build rank confidence.
TIME (minutes): 45 minutes`;

  const parsed = parseNowAction(raw, 30);
  assert.ok(parsed);
  assert.equal(
    parsed.action,
    'Solve 12 Rotational Motion PYQs (2021-2023) with a strict stopwatch.'
  );
  assert.equal(parsed.timeMinutes, 45);
});

test('containsSevereDistress detects hopelessness and self-harm phrases', () => {
  assert.equal(
    containsSevereDistress('I feel completely hopeless and want to give up on life'),
    true
  );
  assert.equal(
    containsSevereDistress('I got a low score in Allen mock test today'),
    false
  );
});

test('generateDemoReply never repeats the same sentence across turns and adapts to topics for all 6 companions', () => {
  const companions = ['motivation', 'calm', 'now', 'mission', 'workout', 'skills'] as const;
  const userTurnsByCompanion: Record<(typeof companions)[number], string[]> = {
    motivation: [
      'hi',
      'I scored 115 marks in my mock test',
      'tell me more',
      'I am struggling with rotational physics',
      'explain how to approach it',
      'still feeling overwhelmed and low',
      'help me',
      'what next',
    ],
    calm: [
      'hi',
      'I am anxious about JEE 2027',
      'not working, give me another way',
      'bad mock score 105 marks',
      'ok better thanks',
      'still feeling stressed',
      'help',
    ],
    now: [
      'What should I do for 30 min?',
      'Give me another Physics PYQ sprint',
      'Give me another',
      'Low energy right now',
      'High energy challenge',
      'Give me another',
      'Give me another',
      'Give me another',
      'Give me another',
    ],
    mission: [
      'hi',
      'help me clear my backlog',
      'tell me more',
      'Create a weekly plan for JEE',
      'I keep forgetting formulas',
      'Give me a reality check',
      'what next',
    ],
    workout: [
      'hi',
      'how many calories and protein in 2 boiled eggs and 1 banana',
      'give me an easier bodyweight circuit',
      'give me a harder challenge',
      'my neck hurts from studying',
      'high protein vegetarian meal plan',
      'what next',
    ],
    skills: [
      'hi',
      'teach me python basics',
      'ok give me day 2',
      'how to use AI prompts for studying',
      'give me more details',
      'video editing tips',
      'what next',
    ],
  };

  for (const comp of companions) {
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    const seenReplies = new Set<string>();
    const seenOpenings = new Set<string>();

    for (const userText of userTurnsByCompanion[comp]) {
      history.push({ role: 'user', content: userText });
      const reply = generateDemoReply({
        companion: comp,
        profile: baseProfile,
        messages: history,
      });
      const trimmed = reply.trim();
      const firstLine = trimmed.split('\n')[0].trim();

      assert.ok(trimmed.length > 20, `${comp} reply should not be empty`);
      assert.equal(
        seenReplies.has(trimmed),
        false,
        `${comp} repeated full reply on "${userText}": ${trimmed}`
      );
      assert.equal(
        seenOpenings.has(firstLine),
        false,
        `${comp} repeated opening line on "${userText}": ${firstLine}`
      );

      if (comp === 'now') {
        const parsed = parseNowAction(trimmed, 30);
        assert.ok(parsed && parsed.action.length > 5, `NOW turn "${userText}" must parse cleanly via parseNowAction`);
      }

      seenReplies.add(trimmed);
      seenOpenings.add(firstLine);
      history.push({ role: 'assistant', content: reply });
    }
  }
});

