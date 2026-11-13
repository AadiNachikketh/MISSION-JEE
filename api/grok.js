/**
 * LAKSHYA — Grok API (xAI) Reusable Integration & Serverless Proxy Helper
 * =========================================================================
 * Endpoint: https://api.x.ai/v1/chat/completions
 *
 * HOW TO DEPLOY THIS PROXY ROUTE:
 * 1. Local / Express / Cloud Run (Included out-of-the-box):
 *    `server.ts` mounts POST `/api/chat` and imports `callGrokServer` from this file.
 *    Set `XAI_API_KEY="xai-..."` in your `.env` file or hosting secrets panel.
 *
 * 2. Vercel Serverless Function:
 *    Place an `api/chat.js` file in your project root exporting `default async function handler(req, res)`
 *    that calls `callGrokServer(req.body)` and returns `res.status(200).json(result)`.
 *    Add `XAI_API_KEY` in Vercel Project Settings -> Environment Variables.
 *
 * 3. Netlify Functions:
 *    Create `netlify/functions/chat.js` exporting `handler = async (event) => { ... }`
 *    and add a redirect in `netlify.toml`: `from = "/api/chat" to = "/.netlify/functions/chat"`.
 */

import {
  containsSevereDistress,
  estimateFoodMacros,
} from '../src/utils/lakshyaLogic.ts';

// Single config constant for the xAI Grok model — change this one value to switch models across the app.
export const GROK_MODEL =
  (typeof process !== 'undefined' && process.env && process.env.XAI_MODEL) ||
  'grok-3-mini';

export const GROQ_CLOUD_MODEL = 'llama-3.3-70b-versatile';

export const XAI_API_ENDPOINT = 'https://api.x.ai/v1/chat/completions';
export const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export const COMPANION_TEMPERATURES = {
  calm: 0.8,
  mission: 0.8,
  motivation: 0.85,
  workout: 0.7,
  skills: 0.75,
  now: 0.5,
};

/**
 * Extracts a short clean excerpt of the user's message so fallback replies feel directly engaged.
 */
function extractUserTopicSnippet(text = '') {
  const cleaned = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.length > 68 ? `${cleaned.slice(0, 65)}...` : cleaned;
}

/**
 * Extracts specific chapter / skill / score details from user text for sharper replies.
 */
function extractSpecificSubjectTopic(text = '') {
  const patterns = [
    /\b(rotational motion|electrostatics|capacitance|current electricity|magnetism|emi|optics|thermodynamics|kinematics|gravitation|shm|waves|modern physics|semiconductors|work power energy|newton'?s laws|circular motion|fluid mechanics)\b/i,
    /\b(organic chemistry|inorganic chemistry|physical chemistry|goc|chemical bonding|equilibrium|electrochemistry|kinetics|coordination compounds|aldehydes|ketones|biomolecules|mole concept|periodic table|p-block|d-block)\b/i,
    /\b(calculus|integration|differentiation|differential equations|matrices|determinants|vectors|3d geometry|conic sections|parabola|ellipse|hyperbola|circle|probability|permutation|combination|complex numbers|quadratic|trigonometry|sequences)\b/i,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) return m[1];
  }
  return '';
}

function extractNumericScore(text = '') {
  const m = text.match(/\b(\d{2,3})\s*(?:marks?|\/\s*300|percentile|%|out of)\b/i);
  return m ? m[1] : '';
}

function normalizeHeadingKey(text = '') {
  const firstLine =
    String(text || '')
      .split('\n')
      .map((l) => l.trim())
      .find(Boolean) || '';
  return firstLine
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Generates deeply personal, non-repeating, context-aware mentor replies when no backend LLM is reachable.
 * Reads full conversation history so it never repeats the same sentence across consecutive turns.
 */
export function generateDemoReply(options = {}) {
  const {
    companion = 'calm',
    profile = {},
    messages = [],
    purpose = 'chat',
  } = options;
  const name = profile?.name || 'Aspirant';
  const goal = profile?.goal || 'IIT Bombay CSE';
  const examYear = profile?.examYear || '2027';
  const struggle = profile?.struggle || 'Consistency';
  const hasBacklog = Boolean(profile?.hasBacklog);
  const pendingChapters = profile?.pendingChapters || 8;
  const syllabusDeadline = profile?.syllabusTarget
    ? `${profile.syllabusTarget.timing} · ${profile.syllabusTarget.month} ${profile.syllabusTarget.year}`
    : 'End of the month · December 2026';

  const userMessages = messages.filter((m) => m.role === 'user');
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  const lastUserMsg =
    userMessages.length > 0
      ? String(userMessages[userMessages.length - 1].content || '')
      : '';
  const prevUserMsg =
    userMessages.length > 1
      ? String(userMessages[userMessages.length - 2].content || '')
      : '';
  const lastAssistantMsg =
    assistantMessages.length > 0
      ? String(assistantMessages[assistantMessages.length - 1].content || '')
      : '';

  const lower = lastUserMsg.toLowerCase().trim();
  const prevAiLower = lastAssistantMsg.toLowerCase();
  const contextText = `${lastUserMsg} ${prevUserMsg} ${lastAssistantMsg}`.toLowerCase();
  const snippet = extractUserTopicSnippet(lastUserMsg);
  const specificChapter =
    extractSpecificSubjectTopic(lastUserMsg) ||
    extractSpecificSubjectTopic(prevUserMsg);
  const mockScore = extractNumericScore(lastUserMsg);

  // Track full replies AND normalized opening headings so we NEVER repeat the same sentence
  const previousAssistantFull = new Set(
    assistantMessages.map((m) => String(m.content || '').trim())
  );
  const previousOpeningKeys = new Set(
    assistantMessages.map((m) => normalizeHeadingKey(m.content))
  );
  const userTurnCount = userMessages.length;

  const pickFresh = (candidates, extraPool = [], fallbackMins = 30) => {
    const allCandidates = [...candidates, ...extraPool].filter(Boolean);
    // 1. Prefer candidates whose full body AND opening heading have never been used
    for (const candidate of allCandidates) {
      const trimmed = candidate.trim();
      const openingKey = normalizeHeadingKey(trimmed);
      if (
        !previousAssistantFull.has(trimmed) &&
        !previousOpeningKeys.has(openingKey)
      ) {
        return candidate;
      }
    }
    // 2. Next prefer candidates whose full text hasn't been used
    for (const candidate of allCandidates) {
      if (!previousAssistantFull.has(candidate.trim())) {
        return candidate;
      }
    }
    // 3. Synthesize a guaranteed-unique follow-up preserving format rules (including NOW's ACTION/WHY/TIME)
    const topicRef = snippet || 'your goal';
    if (companion === 'now') {
      return `ACTION: Round ${userTurnCount} — Solve ${Math.max(4, Math.min(12, Math.round(fallbackMins / 4)))} timed JEE PYQs focused on "${topicRef}" without checking solutions early.\nWHY: Each fresh timed round builds exam-hall speed toward ${goal}.\nTIME: ${fallbackMins}`;
    }
    const angles = [
      `Keep moving forward on "${topicRef}" — finish one 15-minute micro-step right now, then check back in.`,
      `Break "${topicRef}" into just 2 tiny parts: read the core idea for 5 minutes, then test 1 simple problem.`,
      `Don't overthink "${topicRef}" — take 1 small action today instead of trying to solve the whole month tonight.`,
    ];
    const angle = angles[userTurnCount % angles.length];
    return `**Turn ${userTurnCount} · Focused Next Step**\n- ${angle}\n1. Pick one small, clear task for the next 20 minutes.\n2. Put your phone away until the timer ends.\n\n**NEXT:** Tell me what you want to tackle right after this step.`;
  };

  // Daily Quote generation fallback
  if (purpose === 'quote') {
    if (hasBacklog) {
      const backlogQuotes = [
        {
          quote: `Clearing ${pendingChapters} pending backlog chapters before ${syllabusDeadline} happens one finished chapter at a time, ${name}—stay locked on your syllabus target for ${goal}.`,
          context: `Syllabus Completion Mode · ${pendingChapters} Chapters Pending`,
        },
        {
          quote: `Every backlog chapter you cross off today brings ${goal} closer and proves that ${struggle.toLowerCase()} cannot stop your comeback.`,
          context: `Backlog Clearance Directive · Deadline: ${syllabusDeadline}`,
        },
      ];
      return JSON.stringify(
        backlogQuotes[new Date().getDate() % backlogQuotes.length]
      );
    }
    const quotes = [
      {
        quote: `Every complex JEE problem you wrestle with today is quietly carving your seat for ${goal}. Don't rush the struggle—let it sharpen you.`,
        context: `Tailored for ${name} · Target JEE ${examYear}`,
      },
      {
        quote: `Ranks aren't built in viral 16-hour bursts; they're forged in the quiet 45-minute blocks when overcoming ${struggle.toLowerCase()} feels hardest.`,
        context: `Orbital Directive · Target: ${goal}`,
      },
      {
        quote: `You don't need to conquer the entire JEE ${examYear} syllabus tonight, ${name}. You just need to win the very next problem in front of you.`,
        context: `Mission Control · Focus over noise`,
      },
    ];
    const dayIndex = new Date().getDate() % quotes.length;
    return JSON.stringify(quotes[dayIndex]);
  }

  // Real-time AI Food Nutrition JSON fallback
  if (purpose === 'food-macros') {
    const est = estimateFoodMacros(lastUserMsg);
    return JSON.stringify({
      name: est.name,
      calories: est.calories,
      protein: est.protein,
      carbs: est.carbs,
      fat: est.fat,
      breakdown: est.breakdown,
    });
  }

  // "Remind me why I started" full-screen personal reminder
  if (purpose === 'why-i-started') {
    const backlogLine = hasBacklog
      ? `\n\nRight now your #1 mission is clearing those ${pendingChapters} pending backlog chapters and finishing your syllabus by ${syllabusDeadline}. Don't look at all ${pendingChapters} at once—just attack the very next chapter today.`
      : `\n\nYour syllabus is on track—now it's all about sharpening your mock test speed, accuracy, and exam temperament.`;
    return `${name}, pause for ten seconds and remember the version of you who first wrote down "${goal}".\n\nYou didn't choose JEE ${examYear} because it was easy or comfortable. You chose it because you wanted to test the outer limits of your discipline, build an unshakeable engineering mind, and open doors that change your trajectory forever.${backlogLine}\n\nYes, battling ${struggle.toLowerCase()} is exhausting. Take one deep breath, forgive yesterday's slip-ups, and put down one honest brick today. We are right here with you.`;
  }

  // Intent detectors
  const isGreeting =
    /^(hi|hii+|hello|hey|yo|sup|namaste|good\s*(morning|afternoon|evening|night)|how are you|what'?s up)\b/i.test(
      lower
    ) && lower.length < 45;
  const isPositiveOrDone =
    /^(yes|yeah|yep|ok|okay|sure|done|finished|did it|completed|ready|thank|thanks|thank you|got it|cool|nice|great|better|helped)\b/i.test(
      lower
    ) && lower.length < 60;
  const isFollowUpMore =
    /\b(more|another|next|else|explain|how do i|how to|why|still|didn'?t work|not working|stuck|what now|what next|example|detail|step)\b/i.test(
      lower
    ) && lower.length < 85;
  const isComfortChoice =
    /\b(comfort|listen|just talk|vent|emotional|sad|cry)\b/i.test(lower);
  const isPlanChoice =
    /\b(study plan|tiny plan|timetable|schedule|routine|give me a plan|step by step)\b/i.test(
      lower
    );
  const isEasier =
    /\b(easier|easy|beginner|too hard|can'?t do|cant do|light)\b/i.test(lower);
  const isHarder =
    /\b(harder|hard|advanced|challenge|tough|intense)\b/i.test(lower);

  const isPhysics =
    /\b(physics|mechanics|rotational|electrostatics|magnetism|optics|thermodynamics|kinematics|gravitation|waves|current|modern physics|hc verma|irodov|emi|shm|fluid)\b/i.test(
      lower
    );
  const isChemistry =
    /\b(chemistry|organic|inorganic|physical chem|goc|aldehyde|ketone|chemical bonding|equilibrium|mole concept|coordination|periodic|electrochemistry|kinetics|ncert)\b/i.test(
      lower
    );
  const isMaths =
    /\b(math|maths|mathematics|calculus|integration|differentiation|algebra|quadratic|complex|matrices|coordinate|conic|vector|3d|probability|permutation|trigonometry)\b/i.test(
      lower
    );
  const isMockTopic =
    /\b(mock|score|marks|percentile|rank|silly|test|negative marking|accuracy|paper)\b/i.test(
      lower
    ) || Boolean(mockScore);
  const isBacklogTopic =
    /\b(backlog|pending|syllabus|behind|late|chapters left|finish syllabus)\b/i.test(
      lower
    );
  const isFocusTopic =
    /\b(focus|concentrat|distract|phone|instagram|youtube|reel|lazy|procrastinat|stuck|can'?t study|cant study|bored|consistency|consistent)\b/i.test(
      lower
    );
  const isAnxietyTopic =
    /\b(anxious|anxiety|scared|fear|panic|nervous|overwhelm|stress|pressure|fail|sad|cry|crying|depress|demotivat|unmotivated|low|worthless|doubt|alone|lonely)\b/i.test(
      lower
    );
  const isParentPressure =
    /\b(parent|mom|dad|mother|father|family|relative|compar|friend scored|ranker|scold)\b/i.test(
      lower
    );
  const isTiredTopic =
    /\b(tired|exhaust|sleepy|burnout|drained|headache|fatigue)\b/i.test(lower);
  const isSleepRoutine =
    /\b(sleep|night|late night|morning|wake up|routine|hours a day|study hours|timetable|schedule)\b/i.test(
      lower
    );
  const isRevisionMemory =
    /\b(forget|forgetting|remember|revis|revision|retain|retention|memory|formulas)\b/i.test(
      lower
    );
  const isInspireStory =
    /\b(motivat|inspir|story|believe|give up|quit|worth it|why am i doing|why should i|dream|iit)\b/i.test(
      lower
    );
  const isHomeTopic = /\b(home|miss|hostel|kota)\b/i.test(lower);

  // 1. CALM (Stress Relief AI)
  if (companion === 'calm') {
    if (containsSevereDistress(lastUserMsg)) {
      return `**You Are Not Alone, ${name}**\n- Your life and safety matter infinitely more than JEE or any score.\n1. Step away from your desk and talk to a parent, friend, or teacher right now.\n2. Call **Tele-MANAS Helpline: 14416** (or 1800-891-4416) — free, private, 24x7.\n\n**TIP:** Take a sip of water and stay with someone you trust.`;
    }

    const calmGeneralPool = [
      `**60-Second Sigh Reset**\n1. Take two quick breaths in through your nose.\n2. Breathe out slowly through your mouth for 6 seconds.\n3. Repeat 3 times before touching any book.\n\n**NEXT:** What is making your chest feel tight right now?`,
      `**Drop the Weight Right Now**\n- You do not have to fix the whole month of JEE ${examYear} in this one minute.\n1. Unclench your jaw and drop your shoulders.\n2. Close all extra browser tabs.\n3. Drink half a glass of water slowly.\n\n**NEXT:** Want a 2-minute breathing reset or just to vent?`,
      `**Quiet Mind Check-In**\n- Carrying "${snippet || 'all this pressure'}" alone makes it feel twice as heavy.\n1. Put both feet flat on the floor.\n2. Look at 3 calm objects in your room and name them.\n3. Take 4 slow breaths.\n\n**NEXT:** Tell me what happened today—I'm listening.`,
      `**3-Minute Paper Brain Dump**\n1. Grab a blank rough sheet and write down every noisy worry in 60 seconds.\n2. Fold the sheet in half and put it face-down on the desk.\n3. Your brain doesn't have to hold it all at once anymore.`,
      `**Shoulder & Jaw Release**\n1. Lift both shoulders up toward your ears for 5 seconds, then drop them heavy.\n2. Unclench your teeth and let your tongue rest softly.\n3. Take 3 slow belly breaths.\n\n**TIP:** Physical tension drops mental panic in under 90 seconds.`,
      `**Gentle Pause for ${name}**\n- Even top students heading to ${goal} have moments where everything feels too loud.\n1. Step back from your desk for 3 minutes.\n2. Wash your face with cool water.\n3. Come back only when your pulse feels calmer.`,
    ];

    if (isPositiveOrDone) {
      return pickFresh(
        [
          `**Glad That Helped, ${name}**\n- Your nervous system just needed a small pause.\n1. Sit calmly for 30 more seconds without rushing.\n2. When ready, pick just 1 light, zero-pressure task.\n\n**NEXT:** Do you want to rest a bit longer or ease back in?`,
          `**Safe & Steady**\n- Notice how much quieter things feel when you slow down for one minute.\n1. Keep a glass of water right beside you.\n2. Be gentle with yourself for the rest of tonight.`,
        ],
        calmGeneralPool
      );
    }

    if (isFollowUpMore) {
      if (prevAiLower.includes('breath') || prevAiLower.includes('sigh')) {
        return pickFresh(
          [
            `**Try the 5-4-3-2-1 Grounding Reset**\n1. Name 5 objects you can see right now.\n2. Touch 4 textures near you (desk, cloth, wall, pen).\n3. Listen for 3 quiet sounds and drop your shoulders.`,
            `**Cold Water Vagus Reset**\n1. Splash cool water on your face and wrists for 15 seconds.\n2. Sit down and exhale slower than you inhale.\n3. Give yourself 3 calm minutes before thinking about books.`,
          ],
          calmGeneralPool
        );
      }
      return pickFresh(
        [
          `**4-7-8 Slow Exhale Technique**\n1. Inhale quietly through your nose for 4 seconds.\n2. Hold gently for 4–7 seconds (whatever feels comfortable).\n3. Breathe out slowly through your mouth for 8 seconds (3 rounds).`,
        ],
        calmGeneralPool
      );
    }

    if (isGreeting) {
      return pickFresh(
        [
          `**Take a Slow Breath, ${name}**\n- You're in a safe, quiet corner—zero lectures right now.\n1. Drop your shoulders and breathe out slowly.\n2. Tell me what feels heaviest today.\n\n**NEXT:** Is it exam stress, mock marks, or feeling drained?`,
          `**Welcome Back, ${name}**\n- Let's quiet the noise before doing anything else.\n1. Take 10 seconds to just breathe.\n2. Share whatever is on your mind in one short line.`,
        ],
        calmGeneralPool
      );
    }

    if (isMockTopic) {
      return pickFresh(
        [
          `**Mock Score Reset**\n- One test${mockScore ? ` (${mockScore})` : ''} is just feedback, not your final JEE ${examYear} rank.\n1. Close the score sheet for 15 minutes.\n2. Stand up and shake out your hands for 20 seconds.\n3. Drink water before reviewing a single mistake.`,
          `**Cool Down After a Hard Test**\n- It hurts because you genuinely care about ${goal}.\n1. Splash cold water on your face.\n2. Take 4 slow breaths (4s in, 6s out).\n3. Promise yourself you won't judge your whole prep from one paper.`,
        ],
        calmGeneralPool
      );
    }

    if (isAnxietyTopic || isParentPressure) {
      return pickFresh(
        [
          `**5-4-3-2-1 Grounding**\n- Your brain is trying to solve the whole future in 5 seconds.\n1. Name 5 things you can see.\n2. Touch 4 surfaces near you.\n3. Listen for 3 quiet sounds and take 1 long exhale.`,
          `**Box Breathing (4-4-4-4)**\n- Caring deeply about ${goal} can feel overwhelming at times.\n1. Inhale for 4 seconds.\n2. Hold for 4 seconds.\n3. Exhale for 4 seconds, rest 4 seconds (repeat 4 times).`,
          `**Step Out of Comparison**\n- Everyone's path to JEE ${examYear} runs at a different pace, ${name}.\n1. Mute noise or scores from others tonight.\n2. Put one hand on your chest and slow your breathing down.`,
        ],
        calmGeneralPool
      );
    }

    if (isHomeTopic) {
      return pickFresh(
        [
          `**5-Minute Warmth Break**\n- Missing home while preparing for JEE ${examYear} is completely human.\n1. Step away from your study desk.\n2. Send a quick message or call someone at home for 3 minutes.\n3. Sip warm water or tea before returning.`,
          `**Comfort Reset**\n- Being far from family takes real strength, ${name}.\n1. Wrap your hands around a warm cup.\n2. Write down one thing you're grateful for at home.`,
        ],
        calmGeneralPool
      );
    }

    if (isTiredTopic || isFocusTopic || isSleepRoutine) {
      return pickFresh(
        [
          `**90-Second Eye & Brain Reset**\n- Forcing yourself while exhausted only builds frustration.\n1. Rub your palms together until warm.\n2. Cup them gently over closed eyes for 45 seconds.\n3. Take a 5-minute walk without your phone.`,
          `**Low-Battery Pause**\n- Fighting ${struggle.toLowerCase()} while tired is tough.\n1. Stand up and stretch both arms overhead.\n2. Look out a window at something far away for 30 seconds.`,
        ],
        calmGeneralPool
      );
    }

    return pickFresh(calmGeneralPool);
  }

  // 2. NOW (Decisive Study Coach — strict ACTION / WHY / TIME)
  if (companion === 'now') {
    const timeMatch = lastUserMsg.match(/(\d+)\s*(min|hr|hour)/i);
    let mins = 30;
    if (lower.includes('15 min')) mins = 15;
    else if (lower.includes('30 min')) mins = 30;
    else if (lower.includes('1 hr') || lower.includes('60 min')) mins = 60;
    else if (lower.includes('2 hr') || lower.includes('120 min')) mins = 90;
    else if (timeMatch) {
      const val = parseInt(timeMatch[1], 10);
      mins = timeMatch[2].toLowerCase().startsWith('h') ? val * 60 : val;
    }

    const energyMatch = lastUserMsg.match(/energy\s*(?:level)?\s*[:=-]?\s*(\d+)/i);
    const energy = energyMatch
      ? parseInt(energyMatch[1], 10)
      : isTiredTopic || lower.includes('low') || isEasier
      ? 25
      : lower.includes('high') || lower.includes('peak') || isHarder
      ? 85
      : 60;

    const nowGeneralPool = [
      `ACTION: Complete 10 timed JEE Main PYQs on ${specificChapter || 'your current chapter'} without peeking at solutions.\nWHY: Timed execution builds exam speed and beats ${struggle.toLowerCase()}.\nTIME: ${mins}`,
      `ACTION: Pick 3 solved examples from ${specificChapter || 'your active topic'}, hide the answers, and solve them fresh on rough paper.\nWHY: Writing steps yourself locks in problem-solving habits faster than reading.\nTIME: ${mins}`,
      `ACTION: Review the last 6 questions you got wrong in your notebook and re-solve them cleanly.\nWHY: Fixing past mistakes earns the fastest score jump toward ${goal}.\nTIME: ${mins}`,
      `ACTION: Put your phone in another room, read 2 pages of crisp formula notes, then solve 5 direct formula PYQs.\nWHY: Quick wins break procrastination in under 10 minutes.\nTIME: ${mins}`,
      `ACTION: Write a 1-page cheat sheet for ${specificChapter || 'your weakest chapter'} from memory, then check what you missed.\nWHY: Active recall shows you the exact gaps before exam day.\nTIME: ${mins}`,
      `ACTION: Do a 15-question mixed sprint (5 Physics + 5 Chemistry + 5 Maths easy PYQs) with a strict stopwatch.\nWHY: Fast subject switching trains your brain for the real JEE paper.\nTIME: ${mins}`,
      `ACTION: Read NCERT highlighted lines for 1 Chemistry or Modern Physics topic and test yourself on 8 key facts.\nWHY: Direct NCERT recall secures rapid marks with zero stress.\nTIME: ${mins}`,
      `ACTION: Take 1 tricky question you skipped earlier, break it into 3 given values, and write only the starting equations.\nWHY: Starting tough problems cleanly removes fear of long calculations.\nTIME: ${mins}`,
    ];

    if (isPhysics) {
      return pickFresh(
        [
          `ACTION: Solve 8 timed Physics PYQs on ${specificChapter || 'your current chapter'}—draw the force or circuit diagram first.\nWHY: Clear diagrams cut Physics silly mistakes in half.\nTIME: ${mins}`,
          `ACTION: Re-derive 3 core Physics formulas or solved examples from ${specificChapter || 'this topic'} on blank paper.\nWHY: Deep concept flow makes tough JEE ${examYear} problems feel natural.\nTIME: ${mins}`,
          `ACTION: Pick 6 medium Mechanics/Electrodynamics PYQs and solve each using conservation laws before brute-force equations.\nWHY: Choosing the cleanest law saves 2 minutes per Physics question.\nTIME: ${mins}`,
        ],
        nowGeneralPool,
        mins
      );
    }

    if (isChemistry) {
      return pickFresh(
        [
          `ACTION: Write 15 key reactions or NCERT exceptions from ${specificChapter || 'your Chemistry chapter'} from memory, then verify.\nWHY: Active NCERT recall locks down fast, easy Chemistry marks.\nTIME: ${mins}`,
          `ACTION: Solve 12 single-choice Chemistry PYQs (2021–2024) and mark every confusing option.\nWHY: Chemistry rewards fast pattern recognition toward ${goal}.\nTIME: ${mins}`,
          `ACTION: Solve 6 numerical Physical Chemistry PYQs writing all units clearly at every step.\nWHY: Unit discipline prevents careless decimal and sign errors.\nTIME: ${mins}`,
        ],
        nowGeneralPool,
        mins
      );
    }

    if (isMaths) {
      return pickFresh(
        [
          `ACTION: Solve 6 JEE Maths PYQs on ${specificChapter || 'your active topic'} with a strict 4-minute timer per question.\nWHY: Timed struggle trains your brain to spot the right algebraic step faster.\nTIME: ${mins}`,
          `ACTION: Re-solve 5 previously missed Maths problems from scratch without checking your notes.\nWHY: Cleaning up stuck steps saves huge time in the exam hall.\nTIME: ${mins}`,
          `ACTION: Practice 8 standard Coordinate/Calculus graph sketches and boundary checks before solving full equations.\nWHY: Visual graphs reveal shortcuts and eliminate wrong options fast.\nTIME: ${mins}`,
        ],
        nowGeneralPool,
        mins
      );
    }

    if (hasBacklog && (isBacklogTopic || (energy > 45 && !isTiredTopic))) {
      return pickFresh(
        [
          `ACTION: Attack 1 pending backlog chapter (${pendingChapters} left before ${syllabusDeadline})—15 min summary notes + 8 JEE Main PYQs.\nWHY: Short notes plus PYQs clear backlog fast without hurting current classes.\nTIME: ${mins}`,
          `ACTION: Pick your shortest pending chapter, list its top 10 formulas, and solve 6 basic PYQs.\nWHY: Finishing one small chapter builds momentum for ${goal}.\nTIME: ${mins}`,
          `ACTION: Watch only a 15-min crisp recap of your pending chapter and immediately solve 5 textbook questions.\nWHY: Immediate practice prevents passive lecture fatigue.\nTIME: ${mins}`,
        ],
        nowGeneralPool,
        mins
      );
    }

    if (energy <= 40 || isTiredTopic || isEasier) {
      return pickFresh(
        [
          `ACTION: Revise 1 page of Physics formulas or Inorganic NCERT tables and test yourself on 5 facts.\nWHY: Light revision still earns real JEE ${examYear} marks when battery is low.\nTIME: ${mins}`,
          `ACTION: Open your mistake notebook and cleanly re-do 4 easy missed questions.\nWHY: Small wins keep your streak alive without draining your brain.\nTIME: ${mins}`,
          `ACTION: Organize tomorrow's study desk and write down the exact 3 chapters for tomorrow morning.\nWHY: Clear planning removes morning friction when you wake up fresh.\nTIME: ${Math.min(20, mins)}`,
        ],
        nowGeneralPool,
        mins
      );
    }

    if (energy >= 75 || isHarder) {
      return pickFresh(
        [
          `ACTION: Solve 5 tough JEE Advanced problems on ${specificChapter || 'your strongest topic'} with zero distractions.\nWHY: Peak focus should go straight into rank-boosting questions.\nTIME: ${mins}`,
          `ACTION: Do a strict ${mins}-minute 15-question mixed Physics + Maths sprint.\nWHY: High-intensity sprints sharpen exam temperament.\nTIME: ${mins}`,
          `ACTION: Attempt 4 multi-concept numerical/integer-type PYQs without any rough-guess shortcuts.\nWHY: Integer problems build rock-solid accuracy under pressure.\nTIME: ${mins}`,
        ],
        nowGeneralPool,
        mins
      );
    }

    return pickFresh(nowGeneralPool, [], mins);
  }

  // 3. MOTIVATION (Lovely Friendly Chatbot — Friend, Teacher & Guide)
  if (companion === 'motivation') {
    if (containsSevereDistress(lastUserMsg)) {
      return `**I'm Right Here With You, ${name}**\n- You matter so much more than any rank or exam.\n1. Please step away from your desk and talk to a parent, sibling, or teacher right now.\n2. Call **Tele-MANAS Helpline: 14416** (free, private, 24x7).\n\n**TIP:** Stay with someone you trust—you never have to face this alone.`;
    }

    const motivationGeneralPool = [
      `**Your Friend & Guide Is Listening, ${name}**\n1. **As your friend:** You don't have to act strong all the time—chasing **${goal}** is tough.\n2. **As your teacher:** Focus only on winning the next **25 minutes**, not the whole year.\n\n**NEXT:** Tell me—do you want comfort right now, or a tiny study plan?`,
      `**One Honest Brick Today**\n- You are already doing something brave by aiming for JEE ${examYear}.\n1. Forget yesterday's missed hours.\n2. Pick ONE small task you can finish in 20 minutes.\n3. Come tell me when you finish it!\n\n**NEXT:** What small task will you do first?`,
      `**Progress Looks Invisible Before It Clicks**\n- Think of water heating from 20°C to 99°C—it looks quiet right before it boils.\n1. Keep showing up for short daily blocks.\n2. Trust the small steps you put in today.\n\n**NEXT:** Which subject needs a friendly boost right now?`,
      `**Shrink the Mountain**\n- Feeling weighed down by "${snippet || 'everything'}" happens when you look at the whole mountain at once.\n1. Look only at the next 1 step in front of your feet.\n2. Work cleanly for 30 minutes, then take a 5-minute break.\n\n**NEXT:** Want me to pick that 1 step for you?`,
      `**Be Kind to Yourself Today, ${name}**\n1. Even top IIT rankers had days where they felt completely lost.\n2. What makes a winner isn't zero bad days—it's showing up again after a bad day.\n\n**NEXT:** What went even slightly right for you today?`,
      `**Your 2-Part Calm Reset**\n- Let's split "${snippet || 'your stress'}" into two boxes:\n1. **Can control now:** Next 30 minutes of study or rest.\n2. **Park for later:** Exam results, other people's marks, and yesterday.\n\n**NEXT:** What will you put in your next 30-minute box?`,
      `**Small Momentum Beats Big Guilt**\n- Guilt steals more energy than hard Physics problems ever will.\n1. Forgive any wasted hours from earlier today.\n2. Drink water, open one easy chapter, and do just 5 questions.\n\n**TIP:** Five honest questions today beat zero perfect plans.`,
      `**Stay In Your Own Lane, ${name}**\n- Your journey to **${goal}** doesn't have to look pretty every day—it just needs to keep moving.\n1. Close social feeds and comparison noise tonight.\n2. End the day with one small win you can feel proud of.\n\n**NEXT:** Want a 15-minute light win before sleep?`,
    ];

    // Follow-up conversation continuity based on what Motivation just said
    if (isComfortChoice && prevAiLower.includes('comfort')) {
      return pickFresh(
        [
          `**I'm Here Just to Listen, ${name}**\n- Zero study pressure right now. Put the books aside for 5 minutes.\n1. You are working hard under huge expectations—it's okay to feel exhausted.\n2. Tell me honestly whatever is hurting or frustrating you today.\n\n**TIP:** You are a human being first, never just an exam rank.`,
        ],
        motivationGeneralPool
      );
    }

    if (isPlanChoice) {
      return pickFresh(
        [
          `**Your Simple 25-Minute Comeback Plan**\n1. **Minutes 0–10:** Read summary formulas for 1 easy chapter (no phone nearby).\n2. **Minutes 10–25:** Solve just 6 straightforward PYQs slowly and cleanly.\n3. **Minute 25:** Stop, stretch, and celebrate showing up!\n\n**NEXT:** Which subject (Physics, Chemistry, or Maths) fits this 25-min block?`,
        ],
        motivationGeneralPool
      );
    }

    if (isFollowUpMore) {
      if (prevAiLower.includes('mock') || prevAiLower.includes('silly') || prevAiLower.includes('score')) {
        return pickFresh(
          [
            `**Exact 3-Step Mock Fix Method**\n1. Make 3 columns in a notebook: **Silly Mistake**, **Forgot Formula**, **Weak Concept**.\n2. Sort your last 10 wrong questions into those 3 boxes.\n3. Fixing just Box 1 & Box 2 raises your score faster than learning any new chapter!\n\n**NEXT:** How many mistakes fell into Silly vs Weak Concept?`,
          ],
          motivationGeneralPool
        );
      }
      if (prevAiLower.includes('physics') || contextText.includes('physics')) {
        return pickFresh(
          [
            `**Step-by-Step Physics Trick**\n1. Read the question slowly and list what is given.\n2. Draw a clean picture or Free Body Diagram first.\n3. Pick the matching rule (Force, Energy, or Momentum) before writing math.\n\n**NEXT:** Which exact Physics chapter are we fixing right now?`,
          ],
          motivationGeneralPool
        );
      }
      if (prevAiLower.includes('backlog') || prevAiLower.includes('10 honest minutes')) {
        return pickFresh(
          [
            `**How to Pick & Finish 1 Backlog Chapter Fast**\n1. Pick a short high-weightage chapter (like Modern Physics, Biomolecules, or Vectors).\n2. Watch a crisp 45-min summary or read short notes—skip 6-hour full lectures for now.\n3. Solve 20 recent JEE Main PYQs to lock it in.\n\n**NEXT:** Which pending chapter sounds easiest to clear first?`,
          ],
          motivationGeneralPool
        );
      }
    }

    if (isPositiveOrDone) {
      return pickFresh(
        [
          `**Proud of You, ${name}!**\n1. Every small step you finish builds real confidence for **${goal}**.\n2. Take a 3-minute breather, sip water, and lock in your next tiny win.\n\n**NEXT:** Ready for the next small challenge or want to rest?`,
          `**That's the Spirit!**\n- Showing up and following through beats ${struggle.toLowerCase()} every single time.\n1. Write down what you just finished.\n2. Give yourself 5 minutes of guilt-free rest before the next block.\n\n**NEXT:** What topic are we tackling next?`,
        ],
        motivationGeneralPool
      );
    }

    if (isGreeting) {
      return pickFresh(
        [
          `**Hey ${name}! Your Friend & Guide Is Here**\n- So glad you dropped in!\n1. Tell me honestly how your day is going.\n2. Want a friendly pep talk, study help, or just someone to listen?\n\n**NEXT:** What's on your mind right now?`,
          `**Welcome Back, ${name}!**\n- Whether today felt amazing or exhausting, I'm right in your corner for **${goal}**.\n1. Tell me one thing on your heart today.\n2. Let's figure out your next simple step together.`,
        ],
        motivationGeneralPool
      );
    }

    if (isInspireStory) {
      return pickFresh(
        [
          `**Remember Why You Started, ${name}**\n- You didn't pick **${goal}** because it was easy—you picked it because part of you knew you were built for something big.\n1. Hard days don't mean you're failing; they mean you're climbing.\n2. Future You will look back at tonight and thank you for not quitting.\n\n**NEXT:** What is making you doubt yourself right now?`,
          `**The Bamboo Tree Rule**\n- For years underground, a bamboo seed grows deep roots while nothing shows above soil—then suddenly shoots up 80 feet in weeks.\n1. Your daily PYQs and late nights are building invisible roots right now.\n2. Keep watering your prep one day at a time for JEE ${examYear}.`,
          `**You Are Stronger Than One Bad Week**\n- Every future IITian has moments where they stare at a blank page feeling hopeless.\n1. Don't quit on a tired night—sleep on it and judge tomorrow.\n2. Put down just 1 small brick today for **${goal}**.`,
        ],
        motivationGeneralPool
      );
    }

    if (isPhysics || isChemistry || isMaths) {
      const subj = isPhysics ? 'Physics' : isChemistry ? 'Chemistry' : 'Maths';
      const ch = specificChapter || subj;
      return pickFresh(
        [
          `**Let's Crack ${ch} Together**\n- Finding ${ch} hard does NOT mean you aren't smart—it just means one bridge is missing.\n1. Study **3 solved examples** slowly (ask *why* each first step was chosen).\n2. Solve **4 easy PYQs** right away to build confidence.\n\n**NEXT:** What specific part of ${ch} feels confusing?`,
          `**Teacher Trick for ${ch}**\n1. Spend 15 minutes writing the 5 main rules of ${ch} in your own simple words.\n2. Test yourself on just 3 questions without peeking.\n3. Check mistakes kindly—don't get angry at errors.\n\n**NEXT:** Want me to give you a 25-minute plan for ${ch}?`,
          `**Friendly Boost for ${subj}**\n- Every single student heading toward ${goal} struggled with ${ch} at first.\n1. Break ${ch} into one tiny 20-minute sub-topic today.\n2. Focus on learning just 1 pattern cleanly.\n\n**NEXT:** Which sub-topic will you open right now?`,
        ],
        motivationGeneralPool
      );
    }

    if (isMockTopic) {
      return pickFresh(
        [
          `**Friend First, Teacher Second**\n- One mock score${mockScore ? ` (${mockScore})` : ''} does **not** decide your JEE ${examYear} future.\n1. **Silly errors:** Easy marks waiting to come back.\n2. **Slipped formulas:** Needs just 15-min revision.\n3. **Hard chapters:** Fix only your top 2 weak topics this week.\n\n**NEXT:** Which of those 3 cost you the most marks?`,
          `**Bounce Back Stronger, ${name}**\n- A tough test hurts only because you truly care about **${goal}**.\n1. Fixing just 3 silly errors jumps your score by 15 marks.\n2. Review 5 wrong questions calmly—no self-blame.\n\n**NEXT:** Which subject dipped the most in this test?`,
          `**Turn Your Test Into Fuel**\n1. Write your top 5 mistakes on one page.\n2. Re-solve them after 2 days without looking.\n3. Watch your confidence rise in the very next mock.\n\n**NEXT:** Tell me your rough score or weakest subject!`,
        ],
        motivationGeneralPool
      );
    }

    if (isRevisionMemory) {
      return pickFresh(
        [
          `**How to Stop Forgetting Old Chapters**\n- Your brain forgets when it only reads passively instead of testing itself.\n1. Spend the last 20 minutes before sleep writing formulas on blank paper.\n2. Solve 3 old chapter PYQs every 3 days.\n\n**NEXT:** Which chapter keeps slipping out of memory?`,
        ],
        motivationGeneralPool
      );
    }

    if (isSleepRoutine) {
      return pickFresh(
        [
          `**Protect Your Sleep, Protect Your Rank**\n1. Studying sleepy for 3 hours remembers less than 1 fresh hour.\n2. Aim for a steady 6.5–7.5 hours sleep window at the same time daily.\n3. Set out tomorrow's first book tonight before turning off the light.\n\n**NEXT:** Are you usually a morning student or night owl?`,
        ],
        motivationGeneralPool
      );
    }

    if (isParentPressure) {
      return pickFresh(
        [
          `**Handling Expectations Kindly**\n- Pressure from family usually comes from worry, even when it feels heavy on you.\n1. Remind yourself: you are studying for your future, not just to prove a point today.\n2. Share one honest, calm update with them about your weekly plan.\n\n**NEXT:** What expectation is weighing on you most right now?`,
          `**You Are Running Your Own Race, ${name}**\n1. Stop comparing your Chapter 3 to someone else's Chapter 10.\n2. Focus on beating yesterday's version of yourself by 1%.\n\n**NEXT:** Want to pick one small win for tonight?`,
        ],
        motivationGeneralPool
      );
    }

    if (isFocusTopic || isBacklogTopic || isTiredTopic) {
      return pickFresh(
        [
          `**Start With Just 10 Minutes**\n- Fighting ${struggle.toLowerCase()}${hasBacklog ? ` with ${pendingChapters} backlog chapters` : ''} feels heavy only before you begin.\n1. Put your phone in another room.\n2. Promise yourself just **10 honest minutes** on 1 small topic.\n3. Once 10 minutes pass, momentum kicks in!\n\n**NEXT:** Which tiny topic will you open for 10 minutes?`,
          `**One Brick Beats Ten Plans**\n- Your brain isn't lazy—it's overwhelmed by trying to finish everything at once.\n1. Pick ONE small task (like 6 PYQs or 2 pages).\n2. Finish it, then come back and tell me!\n\n**NEXT:** Ready to start that 1 small task right now?`,
          `**Clean Focus Reset**\n1. Close every tab except what you need.\n2. Set a 25-minute timer.\n3. Take a 5-minute walk when it rings—no guilt.\n\n**NEXT:** Want me to cheer you on after your next 25-min block?`,
        ],
        motivationGeneralPool
      );
    }

    if (isAnxietyTopic) {
      return pickFresh(
        [
          `**I Hear You, ${name} — Let's Slow Down**\n- Feeling down or scared on the road to **${goal}** is completely normal.\n1. Take 3 slow breaths right now.\n2. Remember how many hard chapters you have already survived.\n3. Today only needs one small honest step.\n\n**NEXT:** What is hurting or worrying you most today?`,
          `**You Don't Have to Carry Everything Tonight**\n1. Give yourself permission to be human when things feel tough.\n2. Drink a glass of water and step back for 5 minutes.\n3. Pick just one light task (like formula review) so you end the day proud.\n\n**NEXT:** Want a lighter plan for today?`,
        ],
        motivationGeneralPool
      );
    }

    return pickFresh(motivationGeneralPool);
  }

  // 4. WORKOUT (Bodyweight-Only AI Coach)
  if (companion === 'workout') {
    const bodyGoal = profile?.bodyGoal || 'Lean & Athletic';
    const workoutHours = profile?.workoutHours || 1;
    const weightKg = profile?.weightKg || 62;
    const heightCm = profile?.heightCm || 172;

    const workoutGeneralPool = [
      `**Today's ${bodyGoal} Workout (${workoutHours}h Max)**\n1. **Warm-Up (6m):** Jumping jacks + arm circles\n2. **Push & Core (18m):** 4 sets × 12 Push-Ups + 45s Plank\n3. **Legs (15m):** 4 sets × 20 Squats + 12 Lunges/leg\n4. **Stretch (5m):** Cobra stretch + slow breathing\n\n**NEXT:** Want an easier version, harder version, or meal ideas?`,
      `**Quick 16-Min Bodyweight Circuit**\n1. **Odd Minutes:** 12 Push-Ups + 20s Plank\n2. **Even Minutes:** 18 Squats + 10 Mountain Climbers\n3. **Finish:** 3 minutes slow breathing\n\n**TIP:** Builds energy fast so you stay fresh for JEE ${examYear}.`,
      `**20-Min Stamina & Strength Flow**\n1. **Jumping Jacks:** 40s work, 20s rest\n2. **Incline or Normal Push-Ups:** 40s work, 20s rest\n3. **Bodyweight Squats:** 40s work, 20s rest\n4. **Plank Hold:** 40s hold, 20s rest (Repeat 4 rounds)\n\n**COACH TIP:** Move steadily and breathe calmly between rounds.`,
      `**Study-Break Mobility & Strength (15 Mins)**\n1. **Inchworms:** 3 sets × 8 slow reps\n2. **Glute Bridges:** 3 sets × 15 reps\n3. **Chair Dips:** 3 sets × 12 reps\n4. **Hollow Hold:** 3 sets × 30 seconds\n\n**NEXT:** Tell me which body part feels sore or stiff!`,
      `**Core & Grip Strength Builder**\n1. **Dead Bugs:** 3 sets × 12 slow reps/side\n2. **Side Plank:** 3 sets × 30s each side\n3. **Towel/Floor Inverted Rows or Scapula Pulls:** 3 sets × 12 reps\n\n**RULE:** Keep breathing—never hold your breath during planks.`,
    ];

    const isSpecificFoodLookup =
      (/\b(how much|calories in|protein in|carbs in|fat in|macros for|macros in|i ate|i had)\b/i.test(
        lower
      ) ||
        /\b\d+\s*(egg|eggs|dosa|idli|roti|rotis|chapati|paratha|banana|g|gm|grams)\b/i.test(
          lower
        )) &&
      !lower.includes('meal plan');

    if (isSpecificFoodLookup) {
      const est = estimateFoodMacros(lastUserMsg);
      return pickFresh(
        [
          `**Nutrition Estimate: ${est.name}**\n1. **Calories:** ${est.calories} kcal\n2. **Protein:** ${est.protein} g\n3. **Carbs:** ${est.carbs} g\n4. **Healthy Fats:** ${est.fat} g\n- **Breakdown:** ${est.breakdown}\n\n**TIP:** Pair carbs with eggs, paneer, dal, or chicken to hit your daily ${bodyGoal} target.`,
        ],
        workoutGeneralPool
      );
    }

    if (isGreeting) {
      return pickFresh(
        [
          `**Bodyweight Coach Ready (${bodyGoal})**\n- **Setup:** ${weightKg}kg, ${heightCm}cm, ${workoutHours}h max/day (zero gym equipment)\n1. Full bodyweight circuit\n2. Neck & back posture fix\n3. Simple protein meal plan\n\n**NEXT:** Which one do you want today?`,
          `**Welcome to Training, ${name}**\n- Your ${bodyGoal} plan keeps workouts under ${workoutHours}h so JEE study stays protected.\n1. Ask for today's strength circuit\n2. Ask for a quick Indian student diet\n\n**NEXT:** How is your energy feeling today?`,
        ],
        workoutGeneralPool
      );
    }

    if (isEasier) {
      return pickFresh(
        [
          `**Beginner-Friendly Bodyweight Flow**\n1. **Wall or Desk Incline Push-Ups:** 3 sets × 12 reps\n2. **Chair-Assisted Squats:** 3 sets × 15 reps\n3. **Knee Plank Hold:** 3 sets × 30 seconds\n4. **Slow Stretching:** 3 minutes\n\n**COACH TIP:** Clean form beats high reps every single day.`,
        ],
        workoutGeneralPool
      );
    }

    if (isHarder) {
      return pickFresh(
        [
          `**Advanced Calisthenics Challenge (${bodyGoal})**\n1. **Decline + Diamond Push-Ups:** 4 sets × 12–15 reps\n2. **Bulgarian Split Squats:** 4 sets × 12 each leg\n3. **Pike Push-Ups (Shoulders):** 3 sets × 10 reps\n4. **Burpee to Plank:** 3 sets × 10 reps\n\n**RULE:** Rest 75 seconds between hard sets and stop within ${workoutHours}h.`,
        ],
        workoutGeneralPool
      );
    }

    if (/\b(posture|neck|back|shoulder|desk|stiff|pain)\b/i.test(lower)) {
      return pickFresh(
        [
          `**8-Minute Desk Posture Fix**\n1. **Wall Angels:** 3 sets × 12 slow reps\n2. **Cat-Cow Stretch:** 2 minutes slow breathing\n3. **Superman Holds:** 3 sets × 30 seconds\n4. **Doorway Chest Stretch:** 45s each side\n\n**TIP:** Clears neck & upper-back stiffness after long study hours.`,
          `**5-Minute Spine Reset Between Study Blocks**\n1. **Chin Tucks:** 2 sets × 15 gentle reps\n2. **Thoracic Twist (Seated):** 30s each side\n3. **Cobra Back Extension:** 3 sets × 30s hold\n\n**COACH TIP:** Keep your screen at eye level while studying.`,
        ],
        workoutGeneralPool
      );
    }

    if (/\b(protein|food|eat|diet|meal|calor|veg|egg|paneer|breakfast|lunch|dinner)\b/i.test(lower)) {
      return pickFresh(
        [
          `**Simple Protein Plan (${bodyGoal} · ${weightKg}kg)**\n1. **Breakfast:** 2–3 boiled eggs OR 50g oats + milk + 1 tbsp peanut butter\n2. **Lunch:** Dal + 100g paneer (or 150g chicken) + 2 rotis + curd\n3. **Snack:** Roasted chana or 1 banana + almonds\n4. **Dinner:** Light sabzi + 2 rotis + dal or paneer\n\n**TIP:** Type or speak your meal above to check exact calories, protein, carbs, and fats.`,
          `**Budget Student High-Protein Swaps**\n1. **Morning:** Besan chilla with paneer stuffing + 1 glass milk\n2. **Study Snack:** 1 handful roasted peanuts or soya chunks (40g boiled)\n3. **Dinner:** Moong dal khichdi + 1 bowl curd\n\n**COACH TIP:** Aim for 20–25g protein in every main meal.`,
          `**Quick Muscle & Brain Fuel Rules**\n1. Drink 2.5–3L water daily (helps focus too).\n2. Pair every carb meal (rice/roti) with protein (eggs/paneer/dal/chicken).\n3. Keep heavy fried snacks low before study blocks so you don't feel sleepy.`,
        ],
        workoutGeneralPool
      );
    }

    if (/\b(pushup|push-up|chest|arm|tricep|core|abs|plank|squat|leg|circuit)\b/i.test(lower)) {
      return pickFresh(
        [
          `**${bodyGoal} Bodyweight Strength**\n1. **Push-Ups:** 4 sets × max clean reps (incline → normal → diamond)\n2. **Squats:** 4 sets × 20 reps + 12 Split Squats/leg\n3. **Core:** 3 sets × 45s Plank + 15 Leg Raises\n\n**RULE:** Rest 60s between sets. Zero equipment needed.`,
          `**Push-Up & Core Progression Plan**\n1. **Step 1 (Easy):** Wall or desk incline push-ups (3 × 15)\n2. **Step 2 (Medium):** Knee or normal push-ups (4 × 10)\n3. **Step 3 (Core Lock):** Dead-bugs + 45s forearm plank (3 rounds)\n\n**COACH TIP:** Keep your body straight like a board—never let hips sag.`,
          `**Lower-Body & Core Power (Zero Equipment)**\n1. **Slow Tempo Squats:** 4 sets × 15 reps (3 seconds down)\n2. **Reverse Lunges:** 3 sets × 12 reps each leg\n3. **Calf Raises + Glute Bridges:** 3 sets × 20 reps\n\n**TIP:** Builds leg stamina and improves blood flow to your brain.`,
        ],
        workoutGeneralPool
      );
    }

    return pickFresh(workoutGeneralPool);
  }

  // 5. SKILLS (Side-Skills AI Mentor)
  if (companion === 'skills') {
    const skillList =
      Array.isArray(profile?.skills) && profile.skills.length > 0
        ? profile.skills.map((s) => s.name).join(', ')
        : 'Python, AI & Video Editing';
    const topSkill = skillList.split(',')[0].trim();

    const skillsGeneralPool = [
      `**${topSkill} — 25-Minute Plan**\n1. **10m Learn:** Pick just ONE small idea in **${topSkill}**.\n2. **15m Make:** Build or edit one tiny thing yourself (don't just watch videos).\n3. **Hard Stop:** Log your session above and return to **${goal}**.\n\n**NEXT:** Are you a total beginner or intermediate in ${topSkill}?`,
      `**7-Day Beginner Roadmap for ${topSkill}**\n1. **Days 1–2:** Learn basic tools & shortcuts (25m/day)\n2. **Days 3–4:** Copy 1 small real example step-by-step\n3. **Days 5–6:** Make your own tiny version\n4. **Day 7:** Finish & review what you built\n\n**NEXT:** Ready for Day 1's exact 25-minute task?`,
      `**How to Balance ${topSkill} + JEE**\n1. **Rule 1:** Never cut sleep or core PYQ hours for side skills.\n2. **Rule 2:** Use one fixed 25-min slot AFTER finishing daily study goals.\n3. **Rule 3:** Build tiny projects—learning by doing is 3× faster.\n\n**NEXT:** Which skill do you want a mini-project for today?`,
      `**25-Minute Rule for Fast Skill Growth**\n1. **Minutes 0–5:** Pick 1 tiny goal before opening your laptop.\n2. **Minutes 5–25:** Practice hands-on without switching tabs.\n3. **Minute 25:** Save your work and close it cleanly.\n\n**NEXT:** Want a Python, AI, or Video Editing drill right now?`,
      `**#1 Core Concept to Master First (${topSkill})**\n1. **Break Big Things Small:** Every pro breaks one big skill into 3 repeatable building blocks.\n2. **Build One Tiny Proof:** Save 1 finished file every 3 days instead of hoarding tutorials.\n3. **Reflect 2 Minutes:** Write 1 sentence on what broke and how you fixed it.`,
    ];

    if (isFollowUpMore || isPositiveOrDone) {
      if (prevAiLower.includes('python')) {
        return pickFresh(
          [
            `**Day 2 Python Challenge (Lists & Dictionaries)**\n1. Store your Physics, Chemistry, and Maths mock marks inside a Python dictionary.\n2. Write a 4-line loop that prints your highest-scoring subject.\n3. Save the file and return to **${goal}** study on time!\n\n**NEXT:** Want Day 3 (Reading & Saving Files) next?`,
          ],
          skillsGeneralPool
        );
      }
      if (prevAiLower.includes('video') || prevAiLower.includes('j-cuts')) {
        return pickFresh(
          [
            `**Day 2 Editing Challenge (Audio & Clean Color)**\n1. Balance voice audio cleanly and lower background music to -18 dB.\n2. Adjust brightness and contrast slightly so faces look crisp.\n3. Export a 20-second clip before your 25-min timer ends!`,
          ],
          skillsGeneralPool
        );
      }
      if (prevAiLower.includes('prompt') || prevAiLower.includes('ai skill')) {
        return pickFresh(
          [
            `**Day 2 AI Challenge (Structured Outputs)**\n1. Tell an AI model to output ONLY JSON or 3 numbered bullets—no intro.\n2. Test it by converting 1 Chemistry chapter into 5 quick quiz questions.\n\n**TIP:** Clear output rules are the secret behind real AI apps.`,
          ],
          skillsGeneralPool
        );
      }
    }

    if (isGreeting) {
      return pickFresh(
        [
          `**Skills Mentor Ready (${topSkill})**\n- **Rule:** 25 minutes max so your JEE study stays safe.\n1. 7-day beginner roadmap\n2. Today's 25-minute hands-on project\n3. Core concept lesson\n\n**NEXT:** Which skill are we practicing today?`,
        ],
        skillsGeneralPool
      );
    }

    if (/\b(python|code|coding|program|web|react|js|html)\b/i.test(lower)) {
      return pickFresh(
        [
          `**Python 25-Minute Sprint**\n1. **10m Learn:** Practice lists and functions with a tiny JEE score tracker.\n2. **15m Build:** Add a loop that calculates your average mock score.\n3. **Stop on Time:** Return to **${goal}** study when the timer rings.\n\n**NEXT:** Want the Day 2 Python challenge?`,
          `**Python Mini-Project (25 Mins)**\n1. **Goal:** Build a 25-line Study Pomodoro Timer.\n2. **Use:** \`time.sleep()\` + a simple countdown loop.\n3. **Bonus:** Use your own timer for Physics PYQs tonight!`,
          `**Day 1 Coding Concept (Functions & Loops)**\n1. Write one function that takes 3 numbers (Physics, Chem, Maths) and returns the total.\n2. Test it with 3 different mock scores.\n3. Save it cleanly in one small file.\n\n**NEXT:** Want to try building a flashcard quiz in Python next?`,
        ],
        skillsGeneralPool
      );
    }

    if (/\b(ai|ml|machine learning|llm|prompt|agent)\b/i.test(lower)) {
      return pickFresh(
        [
          `**AI Skill 25-Minute Sprint**\n1. **10m Learn:** See how Role + Clear Rules + Output Format control AI answers.\n2. **15m Build:** Write one prompt that turns any Physics chapter into 5 quick flashcards.\n3. **Stop on Time:** Switch straight back to JEE study.\n\n**NEXT:** Want to learn prompting, AI APIs, or ML math next?`,
          `**Build an AI Study Helper Prompt (25 Mins)**\n1. Give the AI a strict role ("JEE Physics tutor").\n2. Ask for 3 step-by-step hints instead of the final answer.\n3. Test it on one hard Mechanics problem today.\n\n**TIP:** Clear rules beat long prompts every single time.`,
        ],
        skillsGeneralPool
      );
    }

    if (/\b(edit|video|premiere|davinci|capcut|after effects|thumbnail|design|ui|ux)\b/i.test(lower)) {
      return pickFresh(
        [
          `**Video Editing 25-Minute Drill**\n1. **10m Practice:** Try **J-cuts & L-cuts** (start audio 0.5s before the video cut).\n2. **15m Edit:** Match 5 fast cuts to music beats + add a smooth 100% → 106% zoom.\n3. **Stop on Time:** Log your sprint and get back to JEE.\n\n**NEXT:** Which editing app are you using?`,
          `**Clean Storytelling Cut Drill (25 Mins)**\n1. Pick one 30-second clip and remove every silent pause.\n2. Add clean 2-word captions only on key words.\n3. Export once and review with sound off to check pacing.\n\n**TIP:** Great pacing beats flashy transitions every time.`,
        ],
        skillsGeneralPool
      );
    }

    return pickFresh(skillsGeneralPool);
  }

  // 6. MISSION (Main Mission AI — gold)
  const missionGeneralPool = [
    `**Today's Mission Targets**\n1. **Practice:** Solve 25 timed PYQs without checking solutions early.\n2. **Fix Mistakes:** Log your top 3 wrong steps in a mistake notebook.\n3. **Stay Steady:** Hit today's study hours target.\n\n**NEXT:** Which chapter are you locking in today?`,
    `**Keep Eyes on ${goal}**\n- **Focus:** Win the next 60 minutes—ignore noise from others.\n- **Rule:** One fully finished chapter beats ten half-read chapters.\n\n**NEXT:** Want a 7-day plan, monthly milestones, or backlog help?`,
    `**Reality Check for JEE ${examYear}**\n1. **Check 1:** Did you solve questions today, or only watch lectures?\n2. **Check 2:** Did you revise yesterday's formulas for 15 minutes?\n3. **Fix:** Spend your next 45 minutes solving unseen PYQs.\n\n**NEXT:** Tell me how many hours you studied so far today!`,
    `**Smart Rank-Boost Formula**\n1. **60% Time:** Active problem solving (PYQs with timer).\n2. **25% Time:** Mistake analysis & formula recall.\n3. **15% Time:** New notes or backlog cleanup.\n\n**NEXT:** Which part of that split needs fixing today?`,
    `**Stop Comparing, Start Executing**\n1. Measure your week ONLY by solved PYQs and mock analysis—not hours staring at videos.\n2. Protect 90 minutes every morning for your toughest subject.\n3. Finish what you start before opening a new chapter.`,
    `**Weekly Discipline Check**\n1. **No Zero Days:** Even on exhausting days, complete 30 minutes of formula revision.\n2. **One Mistake Book:** Every wrong test question goes inside it with a 1-line reason.\n\n**NEXT:** Tell me your biggest hurdle this week!`,
  ];

  if (isFollowUpMore && prevAiLower.includes('backlog')) {
    return pickFresh(
      [
        `**Exact Order to Clear ${pendingChapters} Pending Chapters**\n1. **High-Yield First:** Start with Modern Physics, Chemical Bonding, Vectors/3D, and Electrostatics.\n2. **Skip Perfection:** Aim for 75% mastery + 25 PYQs first instead of waiting for 100%.\n3. **Weekend Test:** Take one 60-min chapter quiz every Sunday.`,
      ],
      missionGeneralPool
    );
  }

  if (isGreeting) {
    return pickFresh(
      [
        `**Mission Control — ${name}**\n- **Goal:** ${goal} (JEE ${examYear})\n- **Status:** ${hasBacklog ? `Clear ${pendingChapters} backlog chapters by ${syllabusDeadline}` : 'No backlogs — focus on mocks & speed'}\n1. Weekly study plan\n2. Monthly milestones\n3. Quick reality check\n\n**NEXT:** Which one do you want right now?`,
        `**Ready for Orders, ${name}**\n- Keeping your eye on **${goal}** (${struggle}).\n1. Ask for a 7-day timetable\n2. Break down your pending chapters\n\n**NEXT:** What is today's #1 study target?`,
      ],
      missionGeneralPool
    );
  }

  if (hasBacklog && (isBacklogTopic || lower.includes('plan') || lower.includes('week'))) {
    return pickFresh(
      [
        `**Backlog Clearance Plan (${pendingChapters} Left → ${syllabusDeadline})**\n1. **60 / 40 Rule:** Spend 60% time on today's class and 40% on old backlog.\n2. **Fast Finish:** Read short notes + solve 25 JEE Main PYQs per pending chapter.\n3. **Daily Target:** Hit your stepped-up hours on the Home card.\n\n**NEXT:** Which chapter are you finishing first this week?`,
        `**Step-by-Step Syllabus Catch-Up**\n1. **Week 1:** Finish top 3 high-weightage pending chapters (notes + 20 PYQs each).\n2. **Week 2:** Finish next 3 chapters + take a 90-min test.\n3. **Morning Rule:** Give your first 90 minutes daily ONLY to backlog.\n\n**NEXT:** Which subject has the most pending chapters?`,
      ],
      missionGeneralPool
    );
  }

  if (lower.includes('plan') || lower.includes('schedule') || lower.includes('week') || lower.includes('milestone') || isSleepRoutine) {
    return pickFresh(
      [
        `**7-Day Plan for ${goal}**\n1. **Mon–Wed:** Two 90-min blocks/day (40% theory, 60% timed PYQs)\n2. **Thu–Fri:** 25 mixed PCM questions every evening with a timer\n3. **Saturday:** Full 3-hour mock test + 90-min mistake check\n4. **Sunday:** Morning formula revision, evening rest\n\n**NEXT:** Which subject starts tomorrow morning?`,
        `**3 Monthly Milestones (JEE ${examYear})**\n1. **Base Lock:** Finish notes + 25 PYQs for every active chapter.\n2. **Cut Silly Errors:** Write every wrong test question in a mistake notebook.\n3. **Exam Speed:** Do 1 timed mock every week.\n\n**NEXT:** Which milestone needs work first?`,
        `**Daily High-Yield Study Routine**\n1. **Morning:** Hardest subject + problem practice (90 mins).\n2. **Afternoon:** Lectures / notes + quick recall.\n3. **Night:** 20-min formula revision + mistake log check.\n\n**NEXT:** Want me to customize this for Physics, Chem, or Maths?`,
      ],
      missionGeneralPool
    );
  }

  if (isRevisionMemory) {
    return pickFresh(
      [
        `**Spaced Revision System for JEE ${examYear}**\n1. **Day 1:** Finish chapter + 1-page formula sheet.\n2. **Day 3 & Day 7:** Spend 20 mins solving 10 random PYQs from it.\n3. **Monthly:** Review your Mistake Notebook before every full mock test.`,
      ],
      missionGeneralPool
    );
  }

  if (isPhysics || isChemistry || isMaths) {
    const subj = isPhysics ? 'Physics' : isChemistry ? 'Chemistry' : 'Maths';
    const ch = specificChapter || subj;
    return pickFresh(
      [
        `**Mission Target: ${ch}**\n1. **Step 1:** Review core formulas and NCERT/class examples in 25 mins.\n2. **Step 2:** Solve 20 timed JEE Main PYQs (2020–2024).\n3. **Step 3:** Log any missed trick in your Mistake Notebook.\n\n**NEXT:** How many chapters in ${subj} are left for you?`,
      ],
      missionGeneralPool
    );
  }

  if (isInspireStory) {
    return pickFresh(
      [
        `**Honest Big-Sibling Check-In, ${name}**\n1. Nobody feels "ready" every morning—discipline means starting anyway.\n2. Protect your dream of **${goal}** with today's 3 checkboxes above.\n3. Check back in after finishing Task #1!`,
      ],
      missionGeneralPool
    );
  }

  if (isMockTopic || isFocusTopic || isAnxietyTopic || isParentPressure) {
    return pickFresh(
      [
        `**Beat ${struggle} Today**\n1. **Remove Friction:** Put your phone in another room during study blocks.\n2. **Start Tiny:** Solve just 15 PYQs instead of worrying about the whole syllabus.\n3. **Night Check:** Review today's mistakes before sleeping.\n\n**NEXT:** Pick one Mission task above and check it off today.`,
        `**Cut Silly Mistakes & Distraction**\n1. Circle key words in every test question ("NOT", "incorrect", units).\n2. Study in clean 45-min focus blocks with a visible clock.\n\n**NEXT:** Which mistake happens to you most during tests?`,
      ],
      missionGeneralPool
    );
  }

  return pickFresh(missionGeneralPool);
}

/**
 * Core server-side / serverless function to call xAI's Grok API or Groq Cloud API.
 */
export async function callGrokServer(options = {}) {
  const {
    systemPrompt,
    messages = [],
    companion = 'calm',
    profile = {},
    purpose = 'chat',
    temperature,
    stream = false,
  } = options;
  const apiKey =
    typeof process !== 'undefined' && process.env
      ? (process.env.XAI_API_KEY || process.env.GROQ_API_KEY || '').trim()
      : '';

  const resolvedTemp =
    typeof temperature === 'number'
      ? temperature
      : COMPANION_TEMPERATURES[companion] ?? 0.7;

  // Fallback to Demo Mode when no API key is configured
  if (!apiKey || apiKey === 'MY_XAI_API_KEY' || apiKey === 'your_xai_api_key_here') {
    const reply = generateDemoReply({ companion, profile, messages, purpose });
    return {
      reply,
      demoMode: true,
      model: `${GROK_MODEL} (Demo Mode)`,
    };
  }

  // Auto-detect Groq Cloud key (starts with "gsk_") vs xAI Grok key
  const isGroqCloudKey = apiKey.startsWith('gsk_');
  const endpoint = isGroqCloudKey ? GROQ_API_ENDPOINT : XAI_API_ENDPOINT;
  const activeModel = isGroqCloudKey
    ? GROK_MODEL.startsWith('grok')
      ? GROQ_CLOUD_MODEL
      : GROK_MODEL
    : GROK_MODEL;

  const payload = {
    model: activeModel,
    temperature: resolvedTemp,
    stream: Boolean(stream),
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || ''),
      })),
    ],
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      console.warn(
        `[LAKSHYA] Upstream AI API returned ${response.status} (${errText}). Falling back to built-in mentor response.`
      );
      const fallbackReply = generateDemoReply({
        companion,
        profile,
        messages,
        purpose,
      });
      return {
        reply: fallbackReply,
        demoMode: true,
        model: `${activeModel} (Fallback)`,
      };
    }

    if (stream) {
      return { response, demoMode: false, model: activeModel };
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      generateDemoReply({ companion, profile, messages, purpose });
    return {
      reply,
      demoMode: false,
      model: data?.model || activeModel,
    };
  } catch (networkErr) {
    console.warn(
      '[LAKSHYA] Network error reaching AI endpoint, using fallback mentor response:',
      networkErr
    );
    const fallbackReply = generateDemoReply({
      companion,
      profile,
      messages,
      purpose,
    });
    return {
      reply: fallbackReply,
      demoMode: true,
      model: `${activeModel} (Fallback)`,
    };
  }
}

const PUBLIC_CORS_AI_ENDPOINT = 'https://text.pollinations.ai/openai';
let _apiChatUnavailable = false;
let _publicAiCooldownUntil = 0;

function getApiBaseUrl() {
  try {
    const raw =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE_URL
        ? String(import.meta.env.VITE_API_BASE_URL).trim()
        : '';
    return raw.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function isInvalidOrRepeatedPublicReply(reply, messages = []) {
  const lower = String(reply || '').toLowerCase().trim();
  if (!lower || lower.length < 12) return true;
  if (
    /important notice|pollinations|enter\.pollinations|legacy text api|rate limit|too many requests|payment required|upgrade to|quota exceeded/i.test(
      lower
    )
  ) {
    return true;
  }
  const heading = normalizeHeadingKey(reply);
  for (const m of messages) {
    if (m.role !== 'assistant') continue;
    const prev = String(m.content || '').trim();
    if (!prev) continue;
    if (prev.toLowerCase() === lower) return true;
    if (heading && normalizeHeadingKey(prev) === heading) return true;
  }
  return false;
}

async function tryPublicCorsAi({ systemPrompt, messages, temperature }) {
  if (Date.now() < _publicAiCooldownUntil) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(PUBLIC_CORS_AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'openai',
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        max_tokens: 340,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10).map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content || ''),
          })),
        ],
      }),
    });

    if (response.status === 402 || response.status === 403 || response.status === 429) {
      _publicAiCooldownUntil = Date.now() + 1800000;
      return null;
    }
    if (!response.ok) return null;

    const data = await response.json();
    const reply = String(data?.choices?.[0]?.message?.content || '').trim();
    if (isInvalidOrRepeatedPublicReply(reply, messages)) {
      _publicAiCooldownUntil = Date.now() + 1800000;
      return null;
    }

    return {
      reply,
      demoMode: false,
      model: data?.model || 'gpt-oss-20b',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function streamTextToClient(replyText, onChunk) {
  if (typeof onChunk === 'function' && replyText) {
    const words = replyText.split(' ');
    const step = Math.max(3, Math.ceil(words.length / 16));
    for (let i = 0; i < words.length; i += step) {
      onChunk(words.slice(0, i + step).join(' '));
      await new Promise((r) => setTimeout(r, 16));
    }
    onChunk(replyText);
  }
}

/**
 * Reusable client/universal function `callGrok({ systemPrompt, messages, ... })`
 * 1) Calls configured backend `/api/chat` (or `${VITE_API_BASE_URL}/api/chat`) when available.
 * 2) On static hosting (e.g. GitHub Pages without backend), calls keyless CORS AI for real live chat.
 * 3) Falls back cleanly to non-repeating conversational mentor replies if rate-limited or offline.
 */
export async function callGrok(options = {}) {
  const {
    systemPrompt,
    messages = [],
    companion = 'calm',
    profile = {},
    purpose = 'chat',
    temperature,
    onChunk,
  } = options;
  // If invoked on the server directly, delegate to callGrokServer
  if (typeof window === 'undefined') {
    return callGrokServer({
      systemPrompt,
      messages,
      companion,
      profile,
      purpose,
      temperature,
      stream: false,
    });
  }

  const resolvedTemp =
    typeof temperature === 'number'
      ? temperature
      : COMPANION_TEMPERATURES[companion] ?? 0.7;

  const apiBase = getApiBaseUrl();
  const isGitHubPages =
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('.github.io');
  const shouldSkipLocalApi =
    _apiChatUnavailable || (isGitHubPages && !apiBase);

  // Tier 1: Backend proxy route (/api/chat or VITE_API_BASE_URL/api/chat)
  if (!shouldSkipLocalApi) {
    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          messages,
          companion,
          profile,
          purpose,
          temperature: resolvedTemp,
          stream: false,
        }),
      });

      if (response.status === 404 || response.status === 405) {
        _apiChatUnavailable = true;
      } else if (response.ok) {
        const data = await response.json();
        const replyText = String(data.reply || '').trim();
        if (replyText && !data.demoMode) {
          await streamTextToClient(replyText, onChunk);
          return {
            reply: replyText,
            demoMode: false,
            model: data.model || GROK_MODEL,
          };
        }
      }
    } catch {
      if (isGitHubPages && !apiBase) {
        _apiChatUnavailable = true;
      }
    }
  }

  // Tier 2: On static GitHub Pages (or server without API key), try keyless CORS AI for user chat
  if (purpose === 'chat') {
    const publicAi = await tryPublicCorsAi({
      systemPrompt,
      messages,
      temperature: resolvedTemp,
    });
    if (publicAi && publicAi.reply) {
      await streamTextToClient(publicAi.reply, onChunk);
      return publicAi;
    }
  }

  // Tier 3: Conversational, non-repeating offline fallback
  const fallbackReply = generateDemoReply({
    companion,
    profile,
    messages,
    purpose,
  });
  await streamTextToClient(fallbackReply, onChunk);
  return {
    reply: fallbackReply,
    demoMode: true,
    model: `${GROK_MODEL} (Smart Mentor)`,
  };
}
