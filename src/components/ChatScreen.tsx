import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Trash2,
  Sparkles,
  Clock,
  Zap,
  Play,
  RefreshCw,
  AlertCircle,
  Wind,
  Compass,
  PhoneCall,
  Heart,
  BookOpen,
  Smile,
  MessageCircleHeart,
  Dumbbell,
  Code2,
  Type,
} from 'lucide-react';
import {
  ChatMessage,
  CompanionId,
  MissionTask,
  ParsedNowAction,
  RoadmapStageId,
  UserProfile,
  buildCompanionSystemPrompt,
  containsSevereDistress,
  formatStrugglesList,
  parseNowAction,
} from '../utils/lakshyaLogic';
import { callGrok } from '../api/grok';
import { BreathingCircle } from './BreathingCircle';
import { Timer } from './Timer';
import { Roadmap } from './Roadmap';

export type CompanionColor = 'cyan' | 'violet' | 'gold' | 'rose';

type MotivationRoleMode = 'all' | 'friend' | 'teacher' | 'guide';

type AiFontLevel = 'easy' | 'big' | 'xl';

const AI_FONT_STORAGE_KEY = 'lakshya_ai_font_level';
const AI_FONT_CHANGE_EVENT = 'lakshya-ai-font-change';

const FONT_SCALE_CONFIG: Record<
  AiFontLevel,
  {
    label: string;
    headingClass: string;
    bodyClass: string;
    userClass: string;
    stepNumClass: string;
    chipClass: string;
  }
> = {
  easy: {
    label: 'Clear',
    headingClass: 'text-[18px] sm:text-[20px] leading-snug',
    bodyClass: 'text-[16px] leading-[1.68]',
    userClass: 'text-[15.5px] leading-[1.6]',
    stepNumClass: 'w-6 h-6 text-xs',
    chipClass: 'text-xs sm:text-[13px]',
  },
  big: {
    label: 'Big',
    headingClass: 'text-[21px] sm:text-[23px] leading-snug',
    bodyClass: 'text-[18px] sm:text-[18.5px] leading-[1.72]',
    userClass: 'text-[17px] leading-[1.65]',
    stepNumClass: 'w-7 h-7 text-sm',
    chipClass: 'text-[13px] sm:text-sm',
  },
  xl: {
    label: 'Extra Big',
    headingClass: 'text-[24px] sm:text-[26px] leading-snug',
    bodyClass: 'text-[20px] sm:text-[21px] leading-[1.78]',
    userClass: 'text-[18.5px] leading-[1.7]',
    stepNumClass: 'w-8 h-8 text-base',
    chipClass: 'text-sm sm:text-[15px]',
  },
};

function renderInlineEmphasis(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-display font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-[#cabeff]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-[#0A0E1F] border border-[#2A3362] font-mono-num text-[0.9em] text-[#22D3EE]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderStructuredMessageContent(
  content: string,
  role: 'user' | 'assistant',
  fontLevel: AiFontLevel,
  accentHex: string
): React.ReactNode {
  const scale = FONT_SCALE_CONFIG[fontLevel];

  if (role === 'user') {
    return (
      <div className={`space-y-2 text-white ${scale.userClass}`}>
        {content.split('\n').map((line, i) => (
          <p key={i} className="min-h-[0.75em]">
            {line}
          </p>
        ))}
      </div>
    );
  }

  const rawLines = content.split('\n');

  return (
    <div className="space-y-2.5">
      {rawLines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) {
          return <div key={idx} className="h-1" aria-hidden="true" />;
        }

        // 1. Markdown Headings (### Title) or Standalone Bold Headings (**Title**)
        const mdHeading = line.match(/^#{1,4}\s+(.+)$/);
        const standaloneBold =
          !line.match(/^\d+[.)]\s/) && !line.match(/^[-•*]\s/)
            ? line.match(/^\*\*([^*]+)\*\*:?$/)
            : null;

        if (mdHeading || standaloneBold) {
          const titleText = (
            mdHeading ? mdHeading[1] : standaloneBold ? standaloneBold[1] : ''
          )
            .replace(/\*\*/g, '')
            .replace(/:$/, '')
            .trim();
          return (
            <h3
              key={idx}
              className={`font-display font-bold text-white tracking-tight pt-1 first:pt-0 ${scale.headingClass}`}
            >
              {titleText}
            </h3>
          );
        }

        // 2. Numbered Steps (1. ..., 2. ..., 3) ...)
        const stepMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
        if (stepMatch) {
          const stepNum = stepMatch[1];
          const stepBody = stepMatch[2];
          return (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl px-3.5 py-2.5 bg-[#0A0E1F]/65 border border-[#2A3362]/70"
            >
              <span
                className={`shrink-0 rounded-lg font-display font-bold flex items-center justify-center mt-0.5 ${scale.stepNumClass}`}
                style={{
                  backgroundColor: `${accentHex}24`,
                  border: `1px solid ${accentHex}66`,
                  color: '#FFFFFF',
                }}
              >
                {stepNum}
              </span>
              <p className={`text-[#F1F5F9] flex-1 ${scale.bodyClass}`}>
                {renderInlineEmphasis(stepBody)}
              </p>
            </div>
          );
        }

        // 3. Bullet List Items (- ..., • ..., * ...)
        const bulletMatch = line.match(/^(?:[-•*]|\u2022)\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-3 pl-1 py-0.5">
              <span
                className="w-2 h-2 rounded-full shrink-0 mt-[0.62em]"
                style={{ backgroundColor: accentHex }}
                aria-hidden="true"
              />
              <p className={`text-[#F1F5F9] flex-1 ${scale.bodyClass}`}>
                {renderInlineEmphasis(bulletMatch[1])}
              </p>
            </div>
          );
        }

        // 4. Key Directives / Takeaways (ACTION:, WHY:, TIME:, **Tip:**, **Next:**, **Coach Tip:**, **Check-In:**, **Goal Focus:**, **Mission Focus:**, **Skill Focus:**)
        const labeledMatch = line.match(
          /^(?:\*\*)?(ACTION|WHY|TIME|TIP|COACH TIP|NEXT|NEXT STEP|RULE|CHECK-IN|GOAL FOCUS|MISSION FOCUS|SKILL FOCUS)(?:\s*\([^)]*\))?(?:\*\*)?\s*[:\-–]\s*(.+)$/i
        );
        if (labeledMatch) {
          const label = labeledMatch[1].replace(/\*\*/g, '').toUpperCase();
          const rest = labeledMatch[2].replace(/^\*\*\s*/, '').trim();
          return (
            <div
              key={idx}
              className="rounded-r-xl bg-[#0A0E1F]/60 pl-3.5 pr-3 py-2 border-l-2"
              style={{ borderLeftColor: accentHex }}
            >
              <span
                className="font-display font-bold tracking-wider text-xs sm:text-sm uppercase mr-2"
                style={{ color: accentHex }}
              >
                {label}:
              </span>
              <span className={`text-[#F8FAFC] ${scale.bodyClass}`}>
                {renderInlineEmphasis(rest)}
              </span>
            </div>
          );
        }

        // 5. Standard Clear Paragraph
        return (
          <p key={idx} className={`text-[#F1F5F9] ${scale.bodyClass}`}>
            {renderInlineEmphasis(line)}
          </p>
        );
      })}
    </div>
  );
}

interface ChatScreenProps {
  companion: CompanionId;
  color: CompanionColor;
  title: string;
  subtitle: string;
  systemPrompt: string;
  profile: UserProfile;
  messages: ChatMessage[];
  onUpdateMessages: (companion: CompanionId, msgs: ChatMessage[]) => void;
  onClearChat: (companion: CompanionId) => void;
  // Also pass motivation messages so the NOW tab can host the in-tab Motivation section seamlessly
  motivationMessages?: ChatMessage[];
  // Mission-specific props
  onUpdateStage?: (stage: RoadmapStageId) => void;
  onToggleStageTask?: (stage: RoadmapStageId, taskIndex: number) => void;
  missionTasks?: MissionTask[];
  onToggleTask?: (taskId: string) => void;
  onAddTask?: (title: string) => void;
  onResetTasks?: () => void;
}

const CALM_QUICK_CHIPS = [
  "I'm anxious about exams",
  'Bad mock test score',
  "Can't focus",
  'Missing home',
];

const NOW_QUICK_CHIPS = [
  'Give me a 30-min Physics PYQ sprint',
  'I feel lazy and stuck—what is one tiny step to start?',
  'Low energy right now, what should I revise?',
  'High energy! Give me a tough JEE Advanced challenge',
];

const MOTIVATION_QUICK_CHIPS = [
  'Talk to me like a close friend—I feel really behind today',
  'Guide me like a teacher: how do I improve my mock scores?',
  'Motivate me! Why should I keep fighting for my JEE dream?',
  'Just listen to me for a minute and help me believe in myself',
];

const MISSION_QUICK_CHIPS = [
  'Break my goal into 3 monthly milestones',
  'Create a realistic weekly study plan for me',
  'Give me an honest big-sibling pep talk',
  'How do I stop my struggle from derailing me?',
];

const WORKOUT_QUICK_CHIPS = [
  'Give me a 20-min no-equipment bodyweight circuit',
  'How do I fix neck & back stiffness from 10h study days?',
  'Best high-protein Indian student meals for my BMI?',
  'Give me a push-up & core progression plan',
];

const SKILLS_QUICK_CHIPS = [
  'Create a 7-day beginner roadmap for my top skill',
  'Give me a 25-minute hands-on mini-project for today',
  'How do I balance learning Python/AI or Editing with JEE?',
  'Teach me the #1 core concept I should master first',
];

const NOW_TIME_CHIPS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '2 hrs+', minutes: 120 },
];

const MOTIVATION_MODES: {
  id: MotivationRoleMode;
  label: string;
  desc: string;
  promptHint: string;
}[] = [
  {
    id: 'all',
    label: 'Friend, Teacher & Guide',
    desc: 'Listen warmly, teach clearly & motivate deeply',
    promptHint:
      'Act as their warm best friend, patient teacher, and inspiring personal guide all in one.',
  },
  {
    id: 'friend',
    label: 'Caring Best Friend',
    desc: 'Pure empathy, listening & emotional support',
    promptHint:
      'Speak like their closest, most loving best friend who listens without judgment and cheers them up.',
  },
  {
    id: 'teacher',
    label: 'Patient Teacher',
    desc: 'Step-by-step guidance & smart JEE study wisdom',
    promptHint:
      'Speak like a warm, brilliant, encouraging teacher who simplifies tough problems and study strategies.',
  },
  {
    id: 'guide',
    label: 'Personal Guide',
    desc: 'Big-picture belief, courage & mindset mentorship',
    promptHint:
      'Speak like a wise, uplifting life & exam guide who helps them see their true potential and stay on course.',
  },
];

export const ChatScreen: React.FC<ChatScreenProps> = ({
  companion,
  color,
  title,
  subtitle,
  systemPrompt,
  profile,
  messages,
  onUpdateMessages,
  onClearChat,
  motivationMessages = [],
  onUpdateStage,
  onToggleStageTask,
  missionTasks = [],
  onToggleTask,
  onAddTask,
  onResetTasks,
}) => {
  // Inside the NOW tab, allow switching between "Now Action & Study Coach" and "Motivation (Friend, Teacher & Guide)"
  const [nowSubSection, setNowSubSection] = useState<'action' | 'motivation'>(
    'action'
  );
  const [motivationRole, setMotivationRole] =
    useState<MotivationRoleMode>('all');

  // Determine the active companion channel (if inside NOW tab and switched to Motivation section, use 'motivation')
  const isNowTabMotivationView =
    companion === 'now' && nowSubSection === 'motivation';
  const effectiveCompanion: CompanionId = isNowTabMotivationView
    ? 'motivation'
    : companion;
  const effectiveColor: CompanionColor = isNowTabMotivationView
    ? 'rose'
    : color;
  const activeMessages: ChatMessage[] = isNowTabMotivationView
    ? motivationMessages
    : messages;

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Synced Understanding-Level Text Size across ALL AI screens (defaults to "Big" for easy reading)
  const [aiFontLevel, setAiFontLevel] = useState<AiFontLevel>(() => {
    try {
      const saved = window.localStorage.getItem(AI_FONT_STORAGE_KEY);
      if (saved === 'easy' || saved === 'big' || saved === 'xl') return saved;
    } catch {
      // Ignore storage failures
    }
    return 'big';
  });

  useEffect(() => {
    const syncFontLevel = () => {
      try {
        const saved = window.localStorage.getItem(AI_FONT_STORAGE_KEY);
        if (saved === 'easy' || saved === 'big' || saved === 'xl') {
          setAiFontLevel(saved);
        }
      } catch {
        // Ignore storage failures
      }
    };
    window.addEventListener(AI_FONT_CHANGE_EVENT, syncFontLevel);
    window.addEventListener('storage', syncFontLevel);
    return () => {
      window.removeEventListener(AI_FONT_CHANGE_EVENT, syncFontLevel);
      window.removeEventListener('storage', syncFontLevel);
    };
  }, []);

  const handleSelectAiFontLevel = (level: AiFontLevel) => {
    setAiFontLevel(level);
    try {
      window.localStorage.setItem(AI_FONT_STORAGE_KEY, level);
      window.dispatchEvent(new Event(AI_FONT_CHANGE_EVENT));
    } catch {
      // Ignore storage failures
    }
  };

  // "Now" companion controls
  const [selectedTimeChip, setSelectedTimeChip] = useState<string>('30 min');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [energyLevel, setEnergyLevel] = useState<number>(65);
  const [latestNowAction, setLatestNowAction] =
    useState<ParsedNowAction | null>(() => {
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === 'assistant' && m.parsedAction);
      return lastAssistant?.parsedAction || null;
    });
  const [activeTimerMinutes, setActiveTimerMinutes] = useState<number | null>(
    null
  );
  const [activeTimerTitle, setActiveTimerTitle] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.parsedAction);
    if (lastAssistant?.parsedAction) {
      setLatestNowAction(lastAssistant.parsedAction);
    } else if (messages.length === 0) {
      setLatestNowAction(null);
      setActiveTimerMinutes(null);
    }
  }, [messages, companion]);

  const themeConfig = {
    cyan: {
      accentHex: '#22D3EE',
      badgeBg: 'bg-[#22D3EE]/12 border-[#22D3EE]/40 text-[#22D3EE]',
      buttonGrad:
        'bg-gradient-to-r from-[#22D3EE] to-[#00cbe6] text-[#001f25] hover:shadow-[0_0_22px_rgba(34,211,238,0.4)]',
      chipActive: 'bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE]',
      glassClass: 'orbital-glass-cyan',
      userBubble: 'bg-[#22D3EE]/15 border-[#22D3EE]/40 text-white',
      aiBubble: 'bg-[#131938]/90 border-[#2A3362] text-[#dee1fa]',
    },
    violet: {
      accentHex: '#7C5CFF',
      badgeBg: 'bg-[#7C5CFF]/15 border-[#7C5CFF]/40 text-[#cabeff]',
      buttonGrad:
        'bg-gradient-to-r from-[#7C5CFF] to-[#633BF3] text-white hover:shadow-[0_0_22px_rgba(124,92,255,0.45)]',
      chipActive: 'bg-[#7C5CFF]/25 border-[#7C5CFF] text-white',
      glassClass: 'orbital-glass-2',
      userBubble: 'bg-[#7C5CFF]/25 border-[#7C5CFF]/50 text-white',
      aiBubble: 'bg-[#131938]/90 border-[#2A3362] text-[#dee1fa]',
    },
    gold: {
      accentHex: '#FFB020',
      badgeBg: 'bg-[#FFB020]/15 border-[#FFB020]/40 text-[#FFB020]',
      buttonGrad:
        'bg-gradient-to-r from-[#FFB020] to-[#F59E0B] text-[#0A0E1F] hover:shadow-[0_0_22px_rgba(255,176,32,0.45)]',
      chipActive: 'bg-[#FFB020]/20 border-[#FFB020] text-[#FFB020]',
      glassClass: 'orbital-glass-gold',
      userBubble: 'bg-[#FFB020]/20 border-[#FFB020]/50 text-white',
      aiBubble: 'bg-[#131938]/90 border-[#2A3362] text-[#dee1fa]',
    },
    rose: {
      accentHex: '#F472B6',
      badgeBg: 'bg-[#F472B6]/15 border-[#F472B6]/40 text-[#fbcfe8]',
      buttonGrad:
        'bg-gradient-to-r from-[#EC4899] via-[#D946EF] to-[#7C5CFF] text-white hover:shadow-[0_0_24px_rgba(236,72,153,0.45)]',
      chipActive: 'bg-[#F472B6]/25 border-[#F472B6] text-white',
      glassClass: 'orbital-glass-rose',
      userBubble: 'bg-[#EC4899]/20 border-[#F472B6]/50 text-white',
      aiBubble: 'bg-[#191330]/90 border-[#F472B6]/30 text-[#dee1fa]',
    },
  }[effectiveColor];

  const sendMessage = async (
    textToSend: string,
    fallbackMins: number = selectedMinutes,
    forceActionParse: boolean = false
  ) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setErrorMsg('');
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...activeMessages, userMessage];
    onUpdateMessages(effectiveCompanion, updatedHistory);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    try {
      const selectedModeHint =
        MOTIVATION_MODES.find((m) => m.id === motivationRole)?.promptHint || '';
      const effectiveSystemPrompt =
        effectiveCompanion === 'motivation'
          ? `${buildCompanionSystemPrompt('motivation', profile)} ${selectedModeHint}`
          : systemPrompt;

      const result = await callGrok({
        companion: effectiveCompanion,
        profile,
        systemPrompt: effectiveSystemPrompt,
        messages: updatedHistory,
        stream: false,
        onChunk: (partial) => {
          setStreamingText(partial);
        },
      });

      setIsDemoMode(result.demoMode);
      const parsedAction =
        effectiveCompanion === 'now'
          ? parseNowAction(result.reply, fallbackMins, forceActionParse)
          : null;

      if (parsedAction) {
        setLatestNowAction(parsedAction);
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString(),
        parsedAction,
      };

      onUpdateMessages(effectiveCompanion, [...updatedHistory, aiMessage]);
      setStreamingText('');
    } catch {
      setErrorMsg(
        "Couldn't reach the AI. Check your connection or API key and try again."
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 60);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input, selectedMinutes, effectiveCompanion === 'now');
  };

  const handleGenerateNowAction = (isAnother: boolean = false) => {
    const energyDesc =
      energyLevel <= 35
        ? 'Low energy (tired, need light revision / formula review / easy PYQs)'
        : energyLevel <= 70
        ? 'Moderate steady energy (ready for focused chapter practice)'
        : 'High peak energy (ready for tough JEE Advanced problem solving or new concepts)';

    const promptText = isAnother
      ? `Give me another different action for ${selectedTimeChip} at ${energyLevel}% energy (${energyDesc}). Reply with ACTION:, WHY:, and TIME:.`
      : `I have ${selectedTimeChip} available right now and my energy level is ${energyLevel}% (${energyDesc}). What is the ONE clear action I should do right now? Reply with ACTION:, WHY:, and TIME:.`;

    sendMessage(promptText, selectedMinutes, true);
  };

  const showDistressBanner =
    (effectiveCompanion === 'calm' || effectiveCompanion === 'motivation') &&
    activeMessages.some((m) => containsSevereDistress(m.content));

  const quickChipsToRender =
    effectiveCompanion === 'calm'
      ? CALM_QUICK_CHIPS
      : effectiveCompanion === 'now'
      ? NOW_QUICK_CHIPS
      : effectiveCompanion === 'motivation'
      ? MOTIVATION_QUICK_CHIPS
      : effectiveCompanion === 'workout'
      ? WORKOUT_QUICK_CHIPS
      : effectiveCompanion === 'skills'
      ? SKILLS_QUICK_CHIPS
      : MISSION_QUICK_CHIPS;

  return (
    <div className="space-y-6 pb-8">
      {/* Companion Top Header Card */}
      <div className={`${themeConfig.glassClass} rounded-3xl p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 text-xs font-display font-semibold uppercase tracking-wider">
              <span style={{ color: themeConfig.accentHex }}>
                {effectiveCompanion === 'calm'
                  ? 'Calm · Stress Relief Companion'
                  : effectiveCompanion === 'now'
                  ? 'Now · Tactical Study Coach'
                  : effectiveCompanion === 'motivation'
                  ? 'Motivation · Lovely Friend, Teacher & Guide'
                  : effectiveCompanion === 'workout'
                  ? 'Workout AI · 100% Bodyweight & Nutrition Coach'
                  : effectiveCompanion === 'skills'
                  ? 'Skills AI · Side-Skill & Coding/Editing Mentor'
                  : 'Mission · North Star Mentor'}
              </span>
              <span aria-hidden="true" className="text-[#64748B]">
                ·
              </span>
              <span className="text-[#94A3B8]">
                Here for {profile.name} (
                {formatStrugglesList(profile.struggles, profile.struggle)})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              {isNowTabMotivationView
                ? `Motivation — Your Friend, Teacher & Guide`
                : title}
            </h1>
            <p className="text-sm text-[#CBD5E1] max-w-2xl">
              {isNowTabMotivationView
                ? `Hey ${profile.name}, talk to me about anything! Whether you need a loving friend to listen, a patient teacher to guide you, or a burst of motivation to achieve "${profile.goal}", I'm right here with you.`
                : subtitle}
            </p>
          </div>

          {activeMessages.length > 0 && (
            <button
              type="button"
              onClick={() => onClearChat(effectiveCompanion)}
              aria-label={`Clear ${effectiveCompanion} chat history`}
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#0A0E1F]/80 hover:bg-[#93000a]/30 border border-[#2A3362] hover:border-[#ffb4ab]/40 text-xs font-display font-semibold text-[#CBD5E1] hover:text-[#ffb4ab] flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear chat</span>
            </button>
          )}
        </div>

        {/* In-Tab Section Switcher inside the NOW Tab: Action Coach vs Motivation (Friend, Teacher & Guide) */}
        {companion === 'now' && (
          <div className="mt-5 pt-4 border-t border-[#2A3362]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-display font-semibold text-[#CBD5E1]">
              Choose your mode inside the NOW tab:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setNowSubSection('action')}
                className={`min-h-[44px] px-4 py-2 rounded-2xl border text-xs font-display font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  nowSubSection === 'action'
                    ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.4)]'
                    : 'bg-[#0A0E1F]/80 border-[#2A3362] text-[#CBD5E1] hover:border-[#7C5CFF]/50'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Next Action &amp; Study Coach</span>
              </button>

              <button
                type="button"
                onClick={() => setNowSubSection('motivation')}
                className={`min-h-[44px] px-4 py-2 rounded-2xl border text-xs font-display font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  nowSubSection === 'motivation'
                    ? 'bg-gradient-to-r from-[#EC4899] to-[#7C5CFF] border-[#F472B6] text-white shadow-[0_0_22px_rgba(236,72,153,0.45)]'
                    : 'bg-[#0A0E1F]/80 border-[#2A3362] text-[#fbcfe8] hover:border-[#F472B6]/60'
                }`}
              >
                <Heart className="w-4 h-4 fill-current text-[#F472B6]" />
                <span>Motivation · Lovely Friend &amp; Guide Chatbot</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tele-MANAS 14416 Care Banner if distress keywords appear */}
      {showDistressBanner && (
        <div
          role="region"
          aria-label="24x7 Support Helpline"
          className="rounded-2xl p-4 bg-[#22D3EE]/15 border border-[#22D3EE] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <PhoneCall className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-display font-bold text-white">
                You don’t have to carry this alone, {profile.name}.
              </p>
              <p className="text-[#dee1fa]">
                Please talk to a parent, sibling, or trusted mentor right now, or call{' '}
                <strong className="text-[#22D3EE]">
                  India’s Tele-MANAS Helpline: 14416
                </strong>{' '}
                (or 1800-891-4416) — free, confidential, 24x7 support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Companion-Specific Interactive Cockpit Widgets */}
      {effectiveCompanion === 'calm' && <BreathingCircle />}

      {/* MOTIVATION Section Widget: Friend, Teacher & Guide Role Selector */}
      {effectiveCompanion === 'motivation' && (
        <div className="orbital-glass-rose rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#F472B6]/20 border border-[#F472B6]/50 flex items-center justify-center text-[#F472B6]">
                <MessageCircleHeart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-display font-bold text-white">
                  How should I support you right now, {profile.name}?
                </h2>
                <p className="text-xs text-[#fbcfe8]">
                  I’m here to listen to you, guide you like a teacher, and cheer you on like a best friend.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {MOTIVATION_MODES.map((m) => {
              const active = motivationRole === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMotivationRole(m.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#EC4899]/25 border-[#F472B6] text-white shadow-[0_0_18px_rgba(244,114,182,0.28)]'
                      : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#F472B6]/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-display font-bold text-xs text-white">
                    {m.id === 'friend' ? (
                      <Smile className="w-3.5 h-3.5 text-[#F472B6]" />
                    ) : m.id === 'teacher' ? (
                      <BookOpen className="w-3.5 h-3.5 text-[#22D3EE]" />
                    ) : (
                      <Heart className="w-3.5 h-3.5 text-[#F472B6]" />
                    )}
                    <span>{m.label}</span>
                  </div>
                  <p className="text-[11px] text-[#CBD5E1] mt-1 line-clamp-2">
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* NOW Action Generator Widget */}
      {effectiveCompanion === 'now' && (
        <div className="orbital-glass-2 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Time Selector */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-display font-semibold tracking-wider text-[#cabeff] uppercase">
                <Clock className="w-3.5 h-3.5 text-[#7C5CFF]" />
                <span>Available Time Window</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {NOW_TIME_CHIPS.map((chip) => {
                  const active = selectedTimeChip === chip.label;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setSelectedTimeChip(chip.label);
                        setSelectedMinutes(chip.minutes);
                      }}
                      className={`min-h-[44px] rounded-xl font-display font-bold text-xs border transition-all cursor-pointer ${
                        active
                          ? 'bg-[#7C5CFF]/25 border-[#7C5CFF] text-white shadow-[0_0_16px_rgba(124,92,255,0.28)]'
                          : 'bg-[#0A0E1F]/70 border-[#2A3362] text-[#CBD5E1] hover:border-[#7C5CFF]/40'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Energy Level Slider */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="now-energy-slider"
                  className="flex items-center gap-2 text-xs font-display font-semibold tracking-wider text-[#cabeff] uppercase"
                >
                  <Zap className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Current Energy Level</span>
                </label>
                <span className="text-xs font-mono-num font-bold text-[#22D3EE]">
                  {energyLevel}% ·{' '}
                  {energyLevel <= 35
                    ? 'Low Battery'
                    : energyLevel <= 70
                    ? 'Steady'
                    : 'Peak Focus'}
                </span>
              </div>
              <input
                id="now-energy-slider"
                type="range"
                min={15}
                max={100}
                step={5}
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full h-2.5 bg-[#0A0E1F] rounded-lg appearance-none cursor-pointer accent-[#7C5CFF]"
              />
              <div className="flex justify-between text-[11px] text-[#94A3B8]">
                <span>15% · Light Revision</span>
                <span>55% · PYQ Drills</span>
                <span>100% · Hard Problems</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-[#94A3B8]">
              No long to-do lists. One decisive action matched to your battery, or chat with Now below.
            </p>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleGenerateNowAction(false)}
              className="min-h-[46px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#633BF3] hover:shadow-[0_0_24px_rgba(124,92,255,0.45)] text-white font-display font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tell Me What To Do Right Now</span>
            </button>
          </div>

          {/* Action Result Card with Start Timer & Give Me Another */}
          {latestNowAction && (
            <div
              data-testid="now-action-result-card"
              className="mt-4 rounded-2xl bg-[#0A0E1F]/90 border border-[#7C5CFF]/60 p-5 space-y-4 shadow-[0_0_30px_rgba(124,92,255,0.15)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-display font-bold tracking-wider uppercase text-[#22D3EE]">
                  Locked-In Directive · {latestNowAction.timeMinutes} Min Block
                </span>
                <span className="text-xs font-mono-num text-[#94A3B8]">
                  Energy: {energyLevel}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-base sm:text-lg font-display font-bold text-white leading-snug">
                  {latestNowAction.action}
                </div>
                <p className="text-xs sm:text-sm text-[#CBD5E1]">
                  <strong className="text-[#cabeff] font-display uppercase tracking-wider text-xs mr-1.5">
                    Why:
                  </strong>
                  {latestNowAction.why}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTimerMinutes(latestNowAction.timeMinutes);
                    setActiveTimerTitle(latestNowAction.action);
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#00cbe6] text-[#001f25] font-display font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start timer ({latestNowAction.timeMinutes}m)</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleGenerateNowAction(true)}
                  className="min-h-[44px] px-4 py-2 rounded-full bg-[#131938] hover:bg-[#1c244f] border border-[#2A3362] text-[#CBD5E1] hover:text-white font-display font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Give me another</span>
                </button>
              </div>

              {activeTimerMinutes !== null && (
                <Timer
                  initialMinutes={activeTimerMinutes}
                  taskTitle={activeTimerTitle || latestNowAction.action}
                  autoStart={true}
                />
              )}
            </div>
          )}
        </div>
      )}

      {effectiveCompanion === 'mission' &&
        onUpdateStage &&
        onToggleStageTask &&
        onToggleTask &&
        onAddTask &&
        onResetTasks && (
          <Roadmap
            profile={profile}
            onUpdateStage={onUpdateStage}
            onToggleStageTask={onToggleStageTask}
            tasks={missionTasks}
            onToggleTask={onToggleTask}
            onAddTask={onAddTask}
            onResetTasks={onResetTasks}
          />
        )}

      {/* Quick Chips Bar for All Companions */}
      <div className="space-y-2">
        <span className="text-xs font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
          {effectiveCompanion === 'motivation'
            ? 'Start a Heart-to-Heart Conversation'
            : 'Quick Prompts'}
        </span>
        <div className="flex flex-wrap gap-2">
          {quickChipsToRender.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isLoading}
              onClick={() =>
                sendMessage(
                  chip,
                  selectedMinutes,
                  effectiveCompanion === 'now'
                )
              }
              className={`min-h-[42px] px-4 py-2 rounded-full bg-[#131938]/85 hover:bg-[#1d2550] border border-[#2A3362] text-[#dee1fa] font-medium transition-all cursor-pointer disabled:opacity-50 ${FONT_SCALE_CONFIG[aiFontLevel].chipClass}`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="orbital-glass-1 rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A3362]/70 pb-3.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#94A3B8]">
            {effectiveCompanion === 'calm' ? (
              <Wind className="w-4 h-4 text-[#22D3EE]" />
            ) : effectiveCompanion === 'now' ? (
              <Zap className="w-4 h-4 text-[#7C5CFF]" />
            ) : effectiveCompanion === 'motivation' ? (
              <Heart className="w-4 h-4 text-[#F472B6] fill-current" />
            ) : effectiveCompanion === 'workout' ? (
              <Dumbbell className="w-4 h-4 text-[#22D3EE]" />
            ) : effectiveCompanion === 'skills' ? (
              <Code2 className="w-4 h-4 text-[#7C5CFF]" />
            ) : (
              <Compass className="w-4 h-4 text-[#FFB020]" />
            )}
            <span className="font-display font-semibold text-white capitalize">
              {effectiveCompanion === 'motivation'
                ? 'Motivation · Lovely Friend, Teacher & Guide'
                : `${effectiveCompanion} Comms Channel`}
            </span>
            {isDemoMode && (
              <span className="text-xs text-[#94A3B8]">
                · Built-in Mentor Active
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Understanding-Level Text Size Control (Synced across all AI tabs) */}
            <div
              role="group"
              aria-label="AI reading text size"
              className="flex items-center gap-1.5 rounded-xl bg-[#0A0E1F]/90 border border-[#2A3362] p-1"
            >
              <span className="flex items-center gap-1 px-2 text-[11px] font-display font-semibold text-[#94A3B8] uppercase tracking-wider">
                <Type className="w-3.5 h-3.5" style={{ color: themeConfig.accentHex }} />
                <span className="hidden sm:inline">Text Size</span>
              </span>
              {(['easy', 'big', 'xl'] as AiFontLevel[]).map((level) => {
                const active = aiFontLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    data-testid={`ai-font-${level}`}
                    aria-pressed={active}
                    onClick={() => handleSelectAiFontLevel(level)}
                    className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                      active
                        ? 'text-[#0A0E1F] shadow-sm'
                        : 'text-[#CBD5E1] hover:text-white'
                    }`}
                    style={
                      active
                        ? { backgroundColor: themeConfig.accentHex }
                        : undefined
                    }
                  >
                    {FONT_SCALE_CONFIG[level].label}
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-[#64748B] font-mono-num">
              {activeMessages.length}{' '}
              {activeMessages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {activeMessages.length === 0 && !isLoading && !errorMsg && (
          <div className="py-10 text-center max-w-xl mx-auto space-y-3">
            <p className="text-lg sm:text-xl font-display font-semibold text-white leading-snug">
              {effectiveCompanion === 'calm'
                ? `Take a breath, ${profile.name}. What’s weighing on your mind today?`
                : effectiveCompanion === 'now'
                ? `Pick your time window & energy above, or ask me what to study right now, ${profile.name}!`
                : effectiveCompanion === 'motivation'
                ? `Hey ${profile.name}! I’m your friend, teacher, and guide. Tell me anything—how your day went, what’s troubling you, or what you want to achieve!`
                : effectiveCompanion === 'workout'
                ? `Ready for simple, step-by-step bodyweight workouts & food plans, ${profile.name}?`
                : effectiveCompanion === 'skills'
                ? `Pick any skill and I’ll teach it in clear, easy 25-minute steps, ${profile.name}.`
                : `Ready to plot your next clear step toward "${profile.goal}", ${profile.name}?`}
            </p>
            <p className="text-sm text-[#CBD5E1] leading-relaxed">
              Replies are big, simple, and arranged step-by-step so everything is easy to understand.
            </p>
          </div>
        )}

        {/* Messages List */}
        <div
          data-testid="ai-messages-list"
          data-font-level={aiFontLevel}
          className="space-y-4 max-h-[560px] overflow-y-auto pr-1"
        >
          {activeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-2xl p-4 sm:p-5 border ${
                  msg.role === 'user'
                    ? `max-w-[88%] sm:max-w-[78%] ${themeConfig.userBubble}`
                    : `max-w-[96%] sm:max-w-[88%] ${themeConfig.aiBubble}`
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2 text-xs text-[#94A3B8]">
                  <span className="font-display font-bold uppercase tracking-wider">
                    {msg.role === 'user'
                      ? profile.name
                      : effectiveCompanion === 'motivation'
                      ? 'MOTIVATION · FRIEND & GUIDE'
                      : `${effectiveCompanion.toUpperCase()} AI`}
                  </span>
                </div>
                {renderStructuredMessageContent(
                  msg.content,
                  msg.role === 'user' ? 'user' : 'assistant',
                  aiFontLevel,
                  themeConfig.accentHex
                )}
              </div>
            </div>
          ))}

          {/* Streaming / Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start" aria-live="polite">
              <div
                className={`max-w-[96%] sm:max-w-[88%] rounded-2xl p-4 sm:p-5 border ${themeConfig.aiBubble}`}
              >
                <div className="flex items-center gap-2 mb-2 text-xs font-display font-bold uppercase tracking-wider text-[#94A3B8]">
                  <span>
                    {effectiveCompanion === 'motivation'
                      ? 'MOTIVATION · FRIEND & GUIDE'
                      : `${effectiveCompanion.toUpperCase()} AI`}
                  </span>
                  <span>·</span>
                  <span>
                    {streamingText ? 'Responding...' : 'Thinking clearly...'}
                  </span>
                </div>
                {streamingText ? (
                  renderStructuredMessageContent(
                    streamingText,
                    'assistant',
                    aiFontLevel,
                    themeConfig.accentHex
                  )
                ) : (
                  <div className="flex items-center gap-2 py-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] animate-bounce" />
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {errorMsg && (
            <div
              role="alert"
              className="rounded-2xl p-4 bg-[#93000a]/30 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#ffb4ab] shrink-0" />
                <span>{errorMsg}</span>
              </div>
              {activeMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const lastUser = [...activeMessages]
                      .reverse()
                      .find((m) => m.role === 'user');
                    if (lastUser) {
                      sendMessage(
                        lastUser.content,
                        selectedMinutes,
                        effectiveCompanion === 'now'
                      );
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#ffb4ab]/20 hover:bg-[#ffb4ab]/30 text-white text-xs font-display font-semibold self-start sm:self-center cursor-pointer whitespace-nowrap"
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Free-Text Chat Input Form */}
        <form onSubmit={handleFormSubmit} className="pt-2 flex items-center gap-2.5">
          <label
            htmlFor={`chat-input-${effectiveCompanion}`}
            className="sr-only"
          >
            Message {effectiveCompanion} AI companion
          </label>
          <input
            id={`chat-input-${effectiveCompanion}`}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              effectiveCompanion === 'calm'
                ? `Tell Calm what's stressing you out, ${profile.name}...`
                : effectiveCompanion === 'now'
                ? `Ask Now what to study or type your time & energy, ${profile.name}...`
                : effectiveCompanion === 'motivation'
                ? `Talk to your friend, teacher & guide about anything, ${profile.name}...`
                : effectiveCompanion === 'workout'
                ? `Ask Workout AI for bodyweight exercises or simple meal plans, ${profile.name}...`
                : effectiveCompanion === 'skills'
                ? `Ask Skills AI for a 25-min step-by-step lesson, ${profile.name}...`
                : 'Ask Mission for milestones, a weekly plan, or a reality check...'
            }
            className="flex-1 h-12 sm:h-13 px-4 rounded-xl bg-[#0A0E1F]/90 border border-[#2A3362] focus:border-[#7C5CFF] focus:outline-none text-[15px] sm:text-base text-white placeholder-[#64748B]"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label={`Send message to ${effectiveCompanion}`}
            className={`min-h-[48px] px-5 rounded-full font-display font-bold text-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap ${themeConfig.buttonGrad}`}
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
