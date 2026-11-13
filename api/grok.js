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

import { containsSevereDistress } from '../src/utils/lakshyaLogic.ts';

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
 * Generates deeply personal, context-aware Demo Mode replies when XAI_API_KEY is not configured.
 * Uses the student's actual profile ({ name, goal, examYear, struggle }) and message content.
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
  const lower = lastUserMsg.toLowerCase();

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

  // "Remind me why I started" full-screen personal reminder
  if (purpose === 'why-i-started') {
    const backlogLine = hasBacklog
      ? `\n\nRight now your #1 mission is clearing those ${pendingChapters} pending backlog chapters and finishing your syllabus by ${syllabusDeadline}. Don't look at all ${pendingChapters} at once—just attack the very next chapter today.`
      : `\n\nYour syllabus is on track—now it's all about sharpening your mock test speed, accuracy, and exam temperament.`;
    return `${name}, pause for ten seconds and remember the version of you who first wrote down "${goal}".\n\nYou didn't choose JEE ${examYear} because it was easy or comfortable. You chose it because you wanted to test the outer limits of your discipline, build an unshakeable engineering mind, and open doors that change your trajectory forever.${backlogLine}\n\nYes, battling ${struggle.toLowerCase()} is exhausting. Take one deep breath, forgive yesterday's slip-ups, and put down one honest brick today. We are right here with you.`;
  }

  // 1. CALM (Stress Relief AI — teal/cyan, under 120 words, validate in 1-2 sentences + 1 practical reset)
  if (companion === 'calm') {
    if (containsSevereDistress(lastUserMsg)) {
      return `${name}, I hear how heavy and overwhelming everything feels right now, and I'm really glad you said it out loud. Please know that your life and well-being matter infinitely more than any exam, rank, or score.\n\nRight now, step away from your desk and talk to someone you trust—a parent, sibling, friend, or mentor—so you don't carry this alone. Please also reach out to **India's Tele-MANAS Helpline at 14416** (or 1800-891-4416)—it is free, confidential, and available 24x7. Take a sip of water and stay safe.`;
    }

    if (lower.includes('mock') || lower.includes('score') || lower.includes('marks')) {
      return `A rough mock score stings, especially when you're working so hard toward ${goal}. It is completely natural for your chest to feel tight after seeing numbers that don't reflect your effort.\n\nLet's do a **3-Minute Diagnostic Detach**: close the score tab right now, stand up, and shake out your hands for 20 seconds. Remind yourself out loud: *"A mock test is a diagnostic radar, not my JEE ${examYear} verdict."* Drink half a glass of cool water before you even think about looking at the paper again.`;
    }

    if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('scared') || lower.includes('fear')) {
      return `It makes complete sense that your mind is racing—caring deeply about ${goal} often shows up as exam anxiety. You aren't weak for feeling this pressure; your nervous system is just on high alert.\n\nTry the **5-4-3-2-1 Grounding Reset** right where you sit: name 5 things you can see on your desk, 4 surfaces you can touch, 3 quiet sounds in the room, 2 scents, and 1 slow exhale. Let your shoulders drop away from your ears, ${name}.`;
    }

    if (lower.includes('home') || lower.includes('lonely') || lower.includes('alone')) {
      return `Missing home while grinding for JEE ${examYear} hits hard in the quiet hours, and it's okay to feel that ache. Carrying a big dream like ${goal} can feel isolating sometimes.\n\nGive yourself a **5-Minute Warmth Break**: step away from your books, send a quick voice note or text to someone at home just to hear their voice, and wrap your hands around a warm cup of water or chai. You're building your future, not losing your roots.`;
    }

    return `Fighting through ${struggle.toLowerCase()} day after day while aiming for ${goal} takes a real emotional toll, ${name}. It is completely okay that your brain feels overloaded right now.\n\nLet's do a **Physiological Sigh** together: take two quick inhales through your nose (one deep breath in, then a tiny top-up sip of air at the top), and a long, slow exhale through your mouth for 6 seconds. Do that three times and just let your jaw unclench.`;
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
    const energy = energyMatch ? parseInt(energyMatch[1], 10) : lower.includes('low') ? 25 : lower.includes('high') ? 85 : 60;

    if (hasBacklog) {
      if (energy <= 40 || lower.includes('tired')) {
        return `ACTION: Complete 1 summary lecture note + 8 foundational NCERT/PYQ examples from your #1 pending backlog chapter (${pendingChapters} chapters left before ${syllabusDeadline}).\nWHY: Low-energy windows still chip away at your syllabus backlog without burning you out.\nTIME: ${mins}`;
      }
      return `ACTION: Attack your highest-weightage pending backlog chapter right now—finish core theory + 12 JEE Main PYQs in one uninterrupted block.\nWHY: You have ${pendingChapters} backlog chapters to clear before ${syllabusDeadline} for ${goal}, and high-focus blocks crush syllabus debt fastest.\nTIME: ${mins}`;
    }

    if (energy <= 40 || lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleepy')) {
      if (mins <= 20) {
        return `ACTION: Revise 1 page of Inorganic Chemistry periodic trends or Physics formula flashcards and write down 5 key exceptions from memory.\nWHY: Low-energy windows are goldmines for high-yield memory retention toward ${goal} without burning mental fuel.\nTIME: ${mins}`;
      }
      return `ACTION: Pick 8 single-choice JEE Main PYQs (2022–2024) from Electrostatics or Coordinate Geometry and solve them open-formula-sheet.\nWHY: Keeps your ${struggle.toLowerCase()} streak alive with zero friction while your battery is low.\nTIME: ${mins}`;
    }

    if (energy >= 75) {
      return `ACTION: Lock your phone away and solve 5 unseen JEE Advanced multi-correct problems in Rotational Mechanics or Calculus under strict timed conditions.\nWHY: Peak mental energy is rare—spend it directly on the rank-deciding problems that move you closer to ${goal}.\nTIME: ${mins}`;
    }

    return `ACTION: Complete 10 targeted JEE Main PYQs on your current chapter, then spend the last 5 minutes logging every mistake into your error notebook.\nWHY: Balanced energy is ideal for timed practice that directly attacks ${struggle.toLowerCase()} and builds exam-hall speed.\nTIME: ${mins}`;
  }

  // 3. MOTIVATION (Lovely Friendly Chatbot — Friend, Teacher & Guide)
  if (companion === 'motivation') {
    if (containsSevereDistress(lastUserMsg)) {
      return `Oh ${name}, I am right here with you, and I care about you so much. Please take a deep breath—you are so much more precious than any exam or rank.\n\nPlease talk to a parent, friend, or teacher you trust right now, and call **India's Tele-MANAS Helpline at 14416** (free, 24x7). You are never alone in this.`;
    }
    const backlogEncouragement = hasBacklog
      ? `I know seeing **${pendingChapters} pending backlog chapters** before **${syllabusDeadline}** can feel intimidating, but we are going to clear them one chapter at a time together.`
      : `Since your syllabus has no backlogs, every mock test and practice drill you do today is pure rank-boosting polish!`;
    return `Hey ${name}, pull up a chair and take a breath—I’m always here to listen to you, whether as your closest friend, your teacher, or your guide.\n\nFirst, as your **friend**: I see how hard you are trying toward **${goal}**, even on days when ${struggle.toLowerCase()} makes you feel stuck. ${backlogEncouragement}\n\nSecond, as your **teacher & guide**: remember that mastery in JEE ${examYear} happens when we break big chapters into tiny, winnable 30-minute concepts. Understand one solved example deeply, then try one similar problem on your own.\n\nI believe in you wholeheartedly, ${name}. Tell me what’s on your mind right now—what can we conquer together today?`;
  }

  // 4. WORKOUT (Bodyweight-Only AI Coach)
  if (companion === 'workout') {
    const bodyGoal = profile?.bodyGoal || 'Lean & Athletic';
    const workoutHours = profile?.workoutHours || 1;
    const weightKg = profile?.weightKg || 62;
    const heightCm = profile?.heightCm || 172;
    return `Hey ${name}! As your **Bodyweight Fitness Coach**, remember our golden rule: **100% bodyweight calisthenics only** (zero gym commute, zero equipment needed) capped at **${workoutHours} hour(s)** so your brain stays razor-sharp for **${goal}**!\n\nTo build your **${bodyGoal}** physique (at ${weightKg}kg / ${heightCm}cm), here is today's high-efficiency circuit:\n1. **Warm-Up (6 mins):** Jumping jacks, arm circles, deep hip openers & desk posture thoracic rotations.\n2. **Upper Body Push & Core (18 mins):** 4 sets of 12 Push-ups (or Diamond/Incline Push-ups) + 45-second Plank holds.\n3. **Lower Body & Explosiveness (15 mins):** 4 sets of 20 Bodyweight Squats + 12 Alternating Lunges + 10 Burpees.\n4. **Cooldown (5 mins):** Cobra stretch & box breathing.\n\nWhat type of body focus or bodyweight move do you want to dial in next—upper body definition, core stamina for long study hours, or nutrition?`;
  }

  // 5. SKILLS (Side-Skills AI Mentor)
  if (companion === 'skills') {
    const skillList =
      Array.isArray(profile?.skills) && profile.skills.length > 0
        ? profile.skills.map((s) => s.name).join(', ')
        : 'Python, AI & Video Editing';
    return `Hey ${name}! Loving the curiosity—building real-world skills in **${skillList}** alongside your JEE ${examYear} prep is a superpower when done in disciplined **25-minute micro-sprints**.\n\nHere is your 3-step micro-plan for today:\n1. **Concept Bite (10 mins):** Pick ONE small concept in **${skillList.split(',')[0]}** (e.g., a single Python function, AI prompt pattern, or keyframe cut).\n2. **Hands-On Build (15 mins):** Write or edit a tiny working demo yourself—never just watch tutorials passively.\n3. **Hard Stop for JEE:** Log your session in the Skills tracker above and switch straight back to your JEE study block for **${goal}**!\n\nWhich specific skill from your list (**${skillList}**) should we break down into a 7-day mini-roadmap right now?`;
  }

  // 6. MISSION (Main Mission AI — gold, under 180 words unless asked for a plan)
  if (hasBacklog) {
    return `Mission Focus Activated, ${name}: **Syllabus & Backlog Clearance Mode**.\n\nYou have **${pendingChapters} pending chapters** to finish by **${syllabusDeadline}** on your road to **${goal}**. Every day from now until ${syllabusDeadline}, our entire system is locked onto completing your syllabus:\n- **Rule 1 (60% Current + 40% Backlog):** Never create new backlog while clearing old chapters. Dedicate a fixed 90-minute daily block exclusively to 1 pending chapter.\n- **Rule 2 (One-Shot + 25 PYQs):** Don't watch 15-hour lectures for backlog chapters—use crisp notes/one-shots and solve 25 JEE Main PYQs to seal the chapter.\n- **Rule 3 (+30m Daily Step-Up):** Follow your stepped-up dashboard study timer today.\n\nWhich of your ${pendingChapters} backlog chapters are we eliminating first this week?`;
  }

  if (lower.includes('plan') || lower.includes('schedule') || lower.includes('week')) {
    return `Here is a realistic, high-impact **7-Day Battle Plan** built around ${goal} and overcoming ${struggle.toLowerCase()}, ${name}:\n\n1. **Mon–Wed (Core Thrust):** Two 90-minute problem blocks per day (40% concept review, 60% timed JEE PYQs). Keep one 30-minute slot exclusively for clearing ${struggle.toLowerCase()} debt.\n2. **Thu–Fri (Mixed Application):** Solve 25 mixed-topic questions across Physics, Chemistry, and Maths each evening using a stopwatch.\n3. **Saturday (Diagnostic Radar):** One full 3-hour timed mock test + 90-minute ruthless error analysis (categorize into Silly, Concept Gap, or Time Crunch).\n4. **Sunday (Reset & Patch):** Revise your formula & mistake log in the morning; take Sunday evening off to recharge.\n\nNo 16-hour fantasy schedules—just relentless daily execution that compounds into JEE ${examYear}. Which subject are we anchoring first tomorrow morning?`;
  }

  return `Look at your target, ${name}: **${goal}**. Since you have **zero pending backlogs**, our entire focus is on test-taking mastery and accuracy before JEE ${examYear}.\n\nRight now, ${struggle.toLowerCase()} is the only real friction standing between your current routine and your potential. Here is how we break your milestone down this week:\n- **Milestone 1:** Hit 30 solved timed PYQs per day.\n- **Milestone 2:** Keep a 1-page Mistake Ledger from your mock tests so you never repeat the same conceptual error twice.\n- **Milestone 3:** Follow your daily stepped-up study target on the dashboard.\n\nTell me which subject mock score we are pushing up first this week!`;
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

/**
 * Reusable client/universal function `callGrok({ systemPrompt, messages, ... })`
 * Calls the backend proxy route `/api/chat` from the browser so `XAI_API_KEY` is never exposed in client code.
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

  try {
    // Request reliable JSON response from /api/chat and animate progressive streaming on client
    const response = await fetch('/api/chat', {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const replyText =
      String(data.reply || '').trim() ||
      generateDemoReply({ companion, profile, messages, purpose });

    if (typeof onChunk === 'function' && replyText) {
      const words = replyText.split(' ');
      let current = '';
      const step = Math.max(3, Math.ceil(words.length / 16));
      for (let i = 0; i < words.length; i += step) {
        current = words.slice(0, i + step).join(' ');
        onChunk(current);
        await new Promise((r) => setTimeout(r, 16));
      }
      onChunk(replyText);
    }

    return {
      reply: replyText,
      demoMode: Boolean(data.demoMode),
      model: data.model || GROK_MODEL,
    };
  } catch (err) {
    console.warn('[LAKSHYA] Falling back to client mentor response:', err);
    const fallbackReply = generateDemoReply({
      companion,
      profile,
      messages,
      purpose,
    });
    if (typeof onChunk === 'function') {
      onChunk(fallbackReply);
    }
    return {
      reply: fallbackReply,
      demoMode: true,
      model: `${GROK_MODEL} (Fallback)`,
    };
  }
}
