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
  return cleaned.length > 72 ? `${cleaned.slice(0, 69)}...` : cleaned;
}

/**
 * Generates deeply personal, non-repeating, context-aware mentor replies when no backend LLM is reachable.
 * Reads full conversation history so it never repeats the same reply across consecutive turns.
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

  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const lower = lastUserMsg.toLowerCase().trim();
  const snippet = extractUserTopicSnippet(lastUserMsg);

  const previousAssistantSet = new Set(
    messages
      .filter((m) => m.role === 'assistant')
      .map((m) => String(m.content || '').trim())
  );
  const userTurnCount = messages.filter((m) => m.role === 'user').length;

  const pickFresh = (candidates) => {
    for (const candidate of candidates) {
      if (!previousAssistantSet.has(candidate.trim())) {
        return candidate;
      }
    }
    const base = candidates[userTurnCount % candidates.length];
    return `${base}\n\n*(Continuing on "${snippet || 'what you shared'}" — tell me the exact next detail you want to tackle so we go step by step!)*`;
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

  const isGreeting =
    /^(hi|hii+|hello|hey|yo|sup|namaste|good\s*(morning|afternoon|evening|night)|how are you|what'?s up)\b/i.test(
      lower
    ) && lower.length < 40;
  const isPhysics =
    /\b(physics|mechanics|rotational|electrostatics|magnetism|optics|thermodynamics|kinematics|gravitation|waves|current|modern physics|hc verma|irodov)\b/i.test(
      lower
    );
  const isChemistry =
    /\b(chemistry|organic|inorganic|physical chem|goc|aldehyde|ketone|chemical bonding|equilibrium|mole concept|coordination|periodic)\b/i.test(
      lower
    );
  const isMaths =
    /\b(math|maths|mathematics|calculus|integration|differentiation|algebra|quadratic|complex|matrices|coordinate|conic|vector|3d|probability|permutation)\b/i.test(
      lower
    );
  const isMockTopic =
    /\b(mock|score|marks|percentile|rank|silly|test|negative marking|accuracy)\b/i.test(
      lower
    );
  const isBacklogTopic =
    /\b(backlog|pending|syllabus|behind|late|chapters left|finish syllabus)\b/i.test(
      lower
    );
  const isFocusTopic =
    /\b(focus|concentrat|distract|phone|instagram|youtube|reel|lazy|procrastinat|stuck|can'?t study|bored)\b/i.test(
      lower
    );
  const isAnxietyTopic =
    /\b(anxious|anxiety|scared|fear|panic|nervous|overwhelm|stress|pressure|parents|expectation|fail)\b/i.test(
      lower
    );
  const isTiredTopic =
    /\b(tired|exhaust|sleep|sleepy|burnout|drained|headache|fatigue)\b/i.test(
      lower
    );
  const isHomeTopic = /\b(home|lonely|alone|miss|family|hostel|kota)\b/i.test(
    lower
  );

  // 1. CALM (Stress Relief AI — teal/cyan, under 120 words, validate in 1-2 sentences + 1 practical reset)
  if (companion === 'calm') {
    if (containsSevereDistress(lastUserMsg)) {
      return `${name}, I hear how heavy and overwhelming everything feels right now, and I'm really glad you said it out loud. Please know that your life and well-being matter infinitely more than any exam, rank, or score.\n\nRight now, step away from your desk and talk to someone you trust—a parent, sibling, friend, or mentor—so you don't carry this alone. Please also reach out to **India's Tele-MANAS Helpline at 14416** (or 1800-891-4416)—it is free, confidential, and available 24x7. Take a sip of water and stay safe.`;
    }

    if (isGreeting) {
      return pickFresh([
        `Hey ${name}, welcome into a quieter space. You don't have to carry JEE ${examYear} on your shoulders right this second.\n\nBefore we do anything else, drop your shoulders 1 inch and take one slow exhale. What feels heaviest in your chest right now?`,
        `Glad you checked in, ${name}. Take ten quiet seconds just to notice your breathing.\n\nTell me honestly—is your mind spinning over exams, marks, or just feeling drained today?`,
      ]);
    }

    if (isMockTopic) {
      return pickFresh([
        `A rough mock score stings, especially when you're pouring everything into ${goal}. It is completely normal for your chest to tighten after seeing numbers that don't reflect your effort.\n\nDo a **3-Minute Diagnostic Detach**: close the score tab, stand up, and shake out your hands for 20 seconds. Remind yourself: *"A mock test is radar, not my JEE ${examYear} verdict."*`,
        `Seeing low marks after hours of prep feels unfair and exhausting, ${name}. Breathe through that initial sting before judging yourself.\n\nTry a **Cold Water Reset**: splash cold water on your face, drink half a glass slowly, and don't touch the paper review for 15 minutes until your pulse settles.`,
      ]);
    }

    if (isAnxietyTopic) {
      return pickFresh([
        `It makes complete sense that your mind is racing—caring deeply about ${goal} often shows up as exam anxiety. You aren't weak for feeling this pressure.\n\nTry the **5-4-3-2-1 Grounding Reset** right where you sit: name 5 things you see on your desk, 4 surfaces you can touch, 3 quiet sounds, 2 scents, and 1 slow exhale.`,
        `When thoughts about "${snippet}" spiral, your brain tries to solve the entire future in five seconds. That would overwhelm anyone.\n\nPut both feet flat on the floor and do **Box Breathing (4-4-4-4)** for four rounds: inhale 4 seconds, hold 4, exhale 4, rest 4.`,
      ]);
    }

    if (isHomeTopic) {
      return pickFresh([
        `Missing home while grinding for JEE ${examYear} hits hard in the quiet hours, and it's okay to feel that ache.\n\nGive yourself a **5-Minute Warmth Break**: step away from your desk, send a quick voice note to someone at home just to hear their voice, and sip warm water or chai.`,
        `Being away from family while chasing ${goal} takes real courage, ${name}. Feeling lonely doesn't mean you're failing—it means you're human.\n\nWrap your hands around something warm for two minutes and write down one small comfort you'll give yourself tonight after finishing your day.`,
      ]);
    }

    if (isTiredTopic || isFocusTopic) {
      return pickFresh([
        `When your eyes and brain are this tired, forcing another hour only builds frustration. Listening to fatigue is smart, not lazy.\n\nClose your eyes for a **90-Second Palming Reset**: rub your palms together until warm and cup them gently over your closed eyes while breathing out slowly.`,
        `Fighting ${struggle.toLowerCase()} on a low battery feels like pushing a boulder uphill. Let's take the pressure off first.\n\nStand up, stretch both arms overhead for 20 seconds, and look at the farthest point out a window to relax your eye muscles.`,
      ]);
    }

    return pickFresh([
      `Hearing "${snippet}" shows how much you're carrying right now while chasing ${goal}, ${name}. It is completely okay to pause when your mind feels overloaded.\n\nLet's do a **Physiological Sigh**: two quick inhales through your nose, then one long 6-second exhale through your mouth. Repeat three times.`,
      `Thank you for sharing "${snippet}" instead of bottling it up, ${name}. Even the sharpest JEE aspirants hit moments where everything feels loud.\n\nUnclench your jaw, drop your shoulders away from your ears, and trace a slow rectangle with your eyes around your room while breathing out for 6 seconds.`,
      `I hear you on "${snippet}". You don't have to fix the whole week in this single minute.\n\nTake 60 seconds right now: close every extra tab, put one hand on your chest, and take five slow, unhurried breaths before deciding your next tiny step.`,
    ]);
  }

  // 2. NOW (Decisive Study Coach — violet, strict ACTION / WHY / TIME format)
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
      : isTiredTopic || lower.includes('low')
      ? 25
      : lower.includes('high') || lower.includes('peak')
      ? 85
      : 60;

    if (isPhysics) {
      return pickFresh([
        `ACTION: Solve 8 timed JEE Main Physics PYQs from your current chapter—draw a free-body or circuit diagram before touching any equation.\nWHY: Physics marks jump fastest when you train setup intuition first instead of memorizing formulas blindly.\nTIME: ${mins}`,
        `ACTION: Take 3 solved Physics examples from "${snippet}", hide the solutions, and re-derive every step cleanly on rough paper.\nWHY: Active re-derivation turns passive reading into exam-hall problem speed for ${goal}.\nTIME: ${mins}`,
      ]);
    }

    if (isChemistry) {
      return pickFresh([
        `ACTION: Write down 15 high-yield reagents, exceptions, or formulas from your current Chemistry chapter from memory, then verify against NCERT.\nWHY: Active NCERT recall locks down free marks in JEE Chemistry without draining heavy mental energy.\nTIME: ${mins}`,
        `ACTION: Solve 12 single-choice Chemistry PYQs (2021–2024) and star every question whose mechanism or trend made you hesitate.\nWHY: Spotting hesitation gaps early turns Chemistry into your fastest scoring section toward ${goal}.\nTIME: ${mins}`,
      ]);
    }

    if (isMaths) {
      return pickFresh([
        `ACTION: Pick 6 medium-to-hard JEE Maths PYQs from your active topic and give each a strict 4-minute clock before checking the hint.\nWHY: Maths rewards timed struggle and clean algebraic manipulation more than passively reading solutions.\nTIME: ${mins}`,
        `ACTION: Review the last 5 Maths questions you got wrong, identify the exact step where your approach stalled, and re-solve all 5 from scratch.\nWHY: Fixing broken problem-entry habits immediately cuts wasted time on JEE exam day.\nTIME: ${mins}`,
      ]);
    }

    if (hasBacklog && (isBacklogTopic || energy > 35)) {
      return pickFresh([
        `ACTION: Attack 1 pending backlog chapter (${pendingChapters} left before ${syllabusDeadline})—read crisp summary notes for 15 minutes, then solve 10 JEE Main PYQs.\nWHY: Splitting theory short and jumping straight into PYQs clears backlog without falling behind current classes.\nTIME: ${mins}`,
        `ACTION: List your 3 highest-weightage pending chapters, pick the shortest one right now, and complete its core formulas + 8 PYQs.\nWHY: Quick backlog wins rebuild momentum toward ${goal} faster than stressing over all ${pendingChapters} chapters.\nTIME: ${mins}`,
      ]);
    }

    if (energy <= 40 || isTiredTopic) {
      return pickFresh([
        `ACTION: Revise 1 page of Physics formula flashcards or Inorganic NCERT tables and write down 5 key facts without peeking.\nWHY: Low-energy windows still earn real JEE ${examYear} marks without burning you out.\nTIME: ${mins}`,
        `ACTION: Open your mistake notebook and cleanly re-solve 5 previously missed PYQs with your formula sheet open.\nWHY: Warm-up wins beat zero progress when your energy is low.\nTIME: ${mins}`,
      ]);
    }

    if (energy >= 75) {
      return pickFresh([
        `ACTION: Put your phone in another room and solve 5 unseen JEE Advanced multi-correct or numerical problems under strict timed pressure.\nWHY: Peak focus is your rarest fuel—spend it on rank-deciding problems for ${goal}.\nTIME: ${mins}`,
        `ACTION: Run a strict ${mins}-minute 15-question mixed sprint across Physics and Maths—no pausing until the timer ends.\nWHY: High-energy timed sprints build the exact exam temperament needed to beat ${struggle.toLowerCase()}.\nTIME: ${mins}`,
      ]);
    }

    return pickFresh([
      `ACTION: Complete 10 targeted JEE Main PYQs on your active chapter, then spend the final 5 minutes logging every mistake.\nWHY: Steady energy is ideal for timed execution that chips away at ${struggle.toLowerCase()}.\nTIME: ${mins}`,
      `ACTION: Pick the hardest sub-topic inside "${snippet || 'your current chapter'}", study 2 solved examples, and immediately test yourself on 6 PYQs.\nWHY: Immediate testing locks concepts in far better than rereading notes.\nTIME: ${mins}`,
    ]);
  }

  // 3. MOTIVATION (Lovely Friendly Chatbot — Friend, Teacher & Guide)
  if (companion === 'motivation') {
    if (containsSevereDistress(lastUserMsg)) {
      return `Oh ${name}, I am right here with you, and I care about you so much. Please take a deep breath—you are so much more precious than any exam or rank.\n\nPlease talk to a parent, friend, or teacher you trust right now, and call **India's Tele-MANAS Helpline at 14416** (free, 24x7). You are never alone in this.`;
    }

    if (isGreeting) {
      return pickFresh([
        `Hey ${name}! So happy you popped in. Pull up a chair—how is your heart and head feeling today? Tell me what's going well or what's bugging you, and we'll figure it out together.`,
        `Hey ${name}, your friend & guide is right here! Tell me what kind of day you're having—are we celebrating a small win, untangling a tough JEE topic, or just needing a friendly pep talk?`,
      ]);
    }

    if (isPhysics || isChemistry || isMaths) {
      const subj = isPhysics ? 'Physics' : isChemistry ? 'Chemistry' : 'Maths';
      return pickFresh([
        `Let's look at **${subj}** together like your patient teacher & friend, ${name}. When "${snippet}" feels tough, it usually isn't because you lack talent—it's just one missing bridge between theory and application.\n\n**Teacher tip:** Don't jump straight to 50 hard questions. Take **3 solved examples**, trace *why* the author chose that exact first step, and then try 3 similar JEE Main PYQs right away.\n\nWhich specific chapter or concept in ${subj} is giving you trouble right now?`,
        `I've got your back on **${subj}**, ${name}! Every top ranker heading to ${goal} once stared at a ${subj} page thinking "why won't this click?"\n\nHere's your friendly reset: spend 20 minutes rewriting the 5 core rules of that topic in your own plain words (as if teaching a junior), then test just 4 problems. Want to break down that exact topic with me right now?`,
      ]);
    }

    if (isMockTopic) {
      return pickFresh([
        `Listen to me as your close friend first, ${name}: one mock score does **not** shrink your dream of **${goal}**. Let yourself feel disappointed for five minutes—and then let's put our teacher hat on together.\n\nLook at your paper and sort every wrong question into 3 buckets:\n1. **Silly / Rushed** (easy marks waiting to come back!)\n2. **Formula slipped** (just needs 15-min revision)\n3. **True concept gap** (pick only top 2 chapters to patch this week)\n\nWhich bucket cost you the most marks in this test?`,
        `A rough test score hurts because you actually care about JEE ${examYear}, ${name}. That pain means you haven't checked out—you're still in the fight!\n\nEven a 15-mark jump next week comes from eliminating 3–4 silly errors. Tell me your rough score or which section dipped, and let's plan a calm comeback together.`,
      ]);
    }

    if (isFocusTopic || isBacklogTopic) {
      return pickFresh([
        `Hey ${name}, I hear you on "${snippet}"—fighting ${struggle.toLowerCase()} while trying to stay consistent is genuinely exhausting. As your friend, I'm not going to lecture you with a harsh schedule.\n\nInstead, let's shrink the mountain: forget the whole day and promise yourself just **one honest 25-minute block** right now on a single small topic. Once the first 5 minutes pass, resistance drops fast. What is one tiny chapter or 5-question set you could start in the next 2 minutes?`,
        `${hasBacklog ? `Seeing ${pendingChapters} backlog chapters before ${syllabusDeadline} can paralyze anyone` : 'Staying locked in every single day takes real grit'}, ${name}. When you feel stuck, your brain isn't lazy—it's overwhelmed by trying to see the finish line all at once.\n\nPick just **one brick** today. Finish one micro-lesson or 8 PYQs, come back and tell me you did it, and I'll be cheering loudest for you!`,
      ]);
    }

    return pickFresh([
      `I'm really glad you told me "${snippet}", ${name}. As your **friend**, I want you to know you never have to pretend everything is easy on this road to **${goal}**.\n\nAs your **teacher & guide**: remember that progress in JEE ${examYear} often looks invisible right before things click. Keep showing up for small, honest study blocks—even imperfect days move the needle forward.\n\nTell me a little more about what's on your mind right now—do you want comfort, a study trick, or a spark of fire?`,
      `I hear every word of "${snippet}", ${name}. You're carrying big dreams for JEE ${examYear}, and it's completely normal to have moments where you wonder if you're doing enough.\n\nPause and give yourself credit for every chapter you've already survived. What would make today feel like a meaningful win for you—even a small one?`,
      `Always in your corner, ${name}! Thinking about "${snippet}" — let's handle it together calmly. Break whatever feels messy into two parts: what you can control in the **next 30 minutes**, and everything else you can park until tomorrow.\n\nWhat's the very next thing you'd like my help with?`,
    ]);
  }

  // 4. WORKOUT (Bodyweight-Only AI Coach)
  if (companion === 'workout') {
    const bodyGoal = profile?.bodyGoal || 'Lean & Athletic';
    const workoutHours = profile?.workoutHours || 1;
    const weightKg = profile?.weightKg || 62;
    const heightCm = profile?.heightCm || 172;

    if (isGreeting) {
      return pickFresh([
        `Hey Coach mode ON, ${name}! At ${weightKg}kg / ${heightCm}cm aiming for **${bodyGoal}** (strictly **100% bodyweight**, capped at **${workoutHours}h** so JEE comes first), what are we dialing in today—upper body push, core stamina, posture mobility, or protein meals?`,
      ]);
    }

    if (/\b(posture|neck|back|shoulder|desk|stiff|pain)\b/i.test(lower)) {
      return pickFresh([
        `Long JEE study hours lock up your chest and upper back, ${name}. Do this **8-Minute Desk Posture Fix** right beside your chair:\n1. **Wall Angels:** 3 sets × 12 slow reps (shoulders flat against wall)\n2. **Thoracic Extensions + Cat-Cow:** 2 minutes slow breathing\n3. **Superman Back Holds:** 3 sets × 30 seconds\n4. **Doorway Chest Stretch:** 45 seconds per side\n\nDo that right after evening study and your neck stiffness will melt away.`,
      ]);
    }

    if (/\b(protein|food|eat|diet|meal|calor|veg|egg|paneer|breakfast|lunch|dinner)\b/i.test(lower)) {
      return pickFresh([
        `For your **${bodyGoal}** target at **${weightKg}kg**, aim for clean student-friendly protein spread across 4 meals:\n- **Breakfast:** 2–3 boiled eggs (or 50g oats + 250ml milk + 1 tbsp peanut butter)\n- **Lunch:** Dal + 100g paneer/tofu or 150g chicken + 2 rotis + curd\n- **Evening Study Snack:** Roasted chana / sprouts / 1 banana + almonds\n- **Dinner:** Light sabzi + 2 rotis + high-protein dal/paneer\n\nType any meal into the **Food & Macro Tracker** above and I'll calculate your exact calories, protein, carbs, and fats live!`,
      ]);
    }

    if (/\b(pushup|push-up|chest|arm|tricep|core|abs|plank|squat|leg|circuit)\b/i.test(lower)) {
      return pickFresh([
        `Here's a focused **${bodyGoal} Bodyweight Progression** for "${snippet}":\n- **Round 1 (Strength):** 4 sets × max clean reps Push-Ups (standard → diamond → decline as you improve)\n- **Round 2 (Legs & Power):** 4 sets × 20 Bodyweight Squats + 12 Split Squats/leg\n- **Round 3 (Core Armor):** 3 sets × 45s Forearm Plank + 15 Leg Raises\n\nRest 60s between sets—zero gym equipment, done inside your ${workoutHours}h limit!`,
      ]);
    }

    return pickFresh([
      `Got it on "${snippet}", ${name}! Staying strictly **100% bodyweight** (within your **${workoutHours}h** cap for ${goal}), here's today's **${bodyGoal}** circuit:\n1. **Warm-Up (6m):** Jumping jacks, arm circles & hip openers\n2. **Push & Core (18m):** 4 × 12 Push-ups + 45s Plank holds\n3. **Lower Body (15m):** 4 × 20 Squats + 12 Lunges/leg + 10 Burpees\n4. **Cooldown (5m):** Cobra stretch & box breathing\n\nWant me to make this harder, easier, or focus on a specific muscle group?`,
      `Let's tailor your **${bodyGoal}** session around "${snippet}", ${name}: switch to **EMOM (Every Minute On the Minute) for 16 minutes**:\n- Odd minutes: 10–15 explosive Push-ups + 20s Plank\n- Even minutes: 18 Bodyweight Squats + 10 Mountain Climbers\n\nIt builds serious conditioning in minimal time so you get straight back to JEE ${examYear} prep!`,
    ]);
  }

  // 5. SKILLS (Side-Skills AI Mentor)
  if (companion === 'skills') {
    const skillList =
      Array.isArray(profile?.skills) && profile.skills.length > 0
        ? profile.skills.map((s) => s.name).join(', ')
        : 'Python, AI & Video Editing';
    const topSkill = skillList.split(',')[0].trim();

    if (/\b(python|code|coding|program)\b/i.test(lower)) {
      return pickFresh([
        `Awesome choice diving into **Python** alongside JEE ${examYear}, ${name}! Here is your **25-Minute Python Micro-Sprint**:\n1. **10 min:** Write a script using lists & functions (e.g., a JEE mock-score accuracy & percentile logger).\n2. **15 min:** Add file saving (` + "`json`" + `) so your scores persist.\n\n**Golden Rule:** Stop sharply at 25 minutes so your primary focus on **${goal}** stays untouched. Want Day 2's Python challenge?`,
        `Let's level up your **Python** skills cleanly: today try building a **Pomodoro CLI Timer** in 25 lines of Python using ` + "`time.sleep`" + ` and functions—useful for your own JEE study blocks too! Ask me if you want the step-by-step code breakdown.`,
      ]);
    }

    if (/\b(ai|ml|machine learning|llm|prompt|agent)\b/i.test(lower)) {
      return pickFresh([
        `Learning **AI** in 25-minute micro-sprints is super smart, ${name}! Today's hands-on mission:\n1. **10 min:** Understand how system prompts, temperature, and structured JSON outputs steer LLMs reliably.\n2. **15 min:** Design a clean 3-part prompt (Role + Constraints + Output Schema) to summarize a Physics chapter into 5 exam flashcards.\n\nStop at 25 mins and jump back to JEE! Which AI area excites you most—prompt engineering, Python + APIs, or ML math?`,
      ]);
    }

    if (/\b(edit|video|premiere|davinci|capcut|after effects|thumbnail|design)\b/i.test(lower)) {
      return pickFresh([
        `Creative **Editing** builds sharp visual storytelling, ${name}! Here's a crisp **25-Minute Editing Drill**:\n1. **10 min:** Practice **J-cuts & L-cuts** (overlapping audio 0.5s before/after video cuts) on a 30-second clip—that single trick makes edits feel instantly cinematic.\n2. **15 min:** Match 5 quick cuts cleanly to beat markers + add subtle keyframe zoom (100% → 106%).\n\nLog your 25m sprint above and protect your JEE study hours!`,
      ]);
    }

    return pickFresh([
      `Loving your curiosity about "${snippet}", ${name}! Building skills in **${skillList}** alongside JEE ${examYear} works best in tight **25-minute micro-sprints**:\n1. **10 mins:** Learn ONE concrete technique in **${topSkill}**.\n2. **15 mins:** Build or edit a tiny real output yourself (no passive tutorial bingeing).\n3. **Hard Stop:** Log it and switch back to **${goal}**.\n\nWhich specific project or sub-skill inside **${topSkill}** should we tackle first?`,
      `Here's a 7-day blueprint for **${topSkill}** (25 mins/day only), ${name}:\n- **Days 1–2:** Core fundamentals & interface/syntax fluency\n- **Days 3–4:** Replicate 1 tiny real-world example from scratch\n- **Days 5–6:** Build your own mini twist on it\n- **Day 7:** Ship & review in 15 mins\n\nTell me your current level in ${topSkill} (complete beginner or intermediate) and I'll give you Day 1's exact exercise!`,
    ]);
  }

  // 6. MISSION (Main Mission AI — gold)
  if (isGreeting) {
    return pickFresh([
      `Mission Control online, ${name}. Eye on **${goal}** (JEE ${examYear}).\n\n${hasBacklog ? `Priority active: clearing **${pendingChapters} pending backlog chapters** by **${syllabusDeadline}**.` : 'Syllabus is clean—focus is pure test-taking sharpness and rank speed.'}\n\nWhat do we need right now: a weekly roadmap, milestone breakdown, or an honest progress check?`,
    ]);
  }

  if (hasBacklog && (isBacklogTopic || lower.includes('plan') || lower.includes('week'))) {
    return pickFresh([
      `Mission Focus Activated, ${name}: **Syllabus & Backlog Clearance Mode**.\n\nYou have **${pendingChapters} pending chapters** to finish by **${syllabusDeadline}** on your road to **${goal}**:\n- **60/40 Rule:** 60% current topics, 40% backlog—never create new backlog while clearing old ones.\n- **One-Shot + 25 PYQs:** Use crisp notes + 25 JEE Main PYQs per backlog chapter instead of 15-hour lectures.\n- **+30m Daily Step-Up:** Follow your stepped-up dashboard target today.\n\nWhich pending chapter are we eliminating first this week?`,
      `Let's break your **${pendingChapters} backlog chapters** into clear milestones before **${syllabusDeadline}**, ${name}:\n1. **Week 1:** Clear the 3 highest-weightage Physics/Chemistry chapters via summary notes + 20 PYQs each.\n2. **Week 2:** Clear next 3 chapters + run a 90-min weekend revision test.\n3. **Daily Rule:** Protect one non-negotiable 90-minute backlog slot every morning.\n\nTell me which subject holds most of your backlog so I can sequence it!`,
    ]);
  }

  if (lower.includes('plan') || lower.includes('schedule') || lower.includes('week') || lower.includes('milestone')) {
    return pickFresh([
      `Here is a realistic **7-Day Battle Plan** built around **${goal}** and beating ${struggle.toLowerCase()}, ${name}:\n\n1. **Mon–Wed (Core Thrust):** Two 90-minute blocks/day (40% concept clarity, 60% timed PYQs).\n2. **Thu–Fri (Mixed Speed):** 25 mixed-subject timed questions every evening.\n3. **Saturday (Radar):** One 3-hour mock test + 90-minute error analysis.\n4. **Sunday (Patch & Recharge):** Formula review in the morning, evening off.\n\nWhich subject are we anchoring tomorrow morning?`,
      `Here are your **3 Monthly Milestones** toward **${goal}** (JEE ${examYear}), ${name}:\n- **Milestone 1 (Foundation Lock):** Zero unrevised class notes + 25 solved PYQs per completed chapter.\n- **Milestone 2 (Speed & Mistake Ledger):** Cut silly/rushed errors by 50% using a dedicated mistake notebook.\n- **Milestone 3 (Exam Temperament):** Weekly full-syllabus timed mocks with calm post-test review.\n\nWhich of the 3 milestones feels weakest right now?`,
    ]);
  }

  if (isMockTopic || isFocusTopic) {
    return pickFresh([
      `Real talk on "${snippet}", ${name}: beating ${struggle.toLowerCase()} doesn't take superhuman willpower—it takes smaller friction.\n\nLock in **3 daily non-negotiables**: (1) Phone outside reach during study blocks, (2) Start with just 15 PYQs instead of staring at a huge syllabus, (3) Review every mistake the same night. Check off one Mission task above right now—which one are you tackling first?`,
    ]);
  }

  return pickFresh([
    `Look at your North Star, ${name}: **${goal}**. On "${snippet}"—here is how we turn intention into rank movement before JEE ${examYear}:\n- **Target 1:** Hit 25–30 timed PYQs today without checking solutions early.\n- **Target 2:** Write down the top 3 mistakes you catch in your Mistake Ledger.\n- **Target 3:** Follow your daily stepped-up study hours on the dashboard.\n\nTell me which specific chapter or target you want to lock in for today!`,
    `Staying locked on **${goal}** means tuning out comparison and winning today's block, ${name}. Regarding "${snippet}": focus purely on your next 60 minutes of active problem solving and let results compound quietly.\n\nDo you want to break down a specific subject plan or review your weekly milestones next?`,
  ]);
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

async function tryPublicCorsAi({ systemPrompt, messages, temperature }) {
  if (Date.now() < _publicAiCooldownUntil) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(PUBLIC_CORS_AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'openai',
        temperature: typeof temperature === 'number' ? temperature : 0.7,
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
      _publicAiCooldownUntil = Date.now() + 300000;
      return null;
    }
    if (!response.ok) return null;

    const data = await response.json();
    const reply = String(data?.choices?.[0]?.message?.content || '').trim();
    if (!reply) return null;

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
