/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Rocket,
  Home as HomeIcon,
  Wind,
  Zap,
  Compass,
  Flame,
  UserCheck,
  Heart,
  Dumbbell,
  Code2,
} from 'lucide-react';
import {
  ChatMessage,
  CompanionId,
  MissionTask,
  MoodId,
  RoadmapStageId,
  StruggleType,
  UserProfile,
  buildCompanionSystemPrompt,
  calculateDaysToExam,
  calculateUpdatedStreak,
  toLocalDateKey,
} from './utils/lakshyaLogic';
import { StarfieldBackground } from './components/StarfieldBackground';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { ChatScreen } from './components/ChatScreen';
import { ProfileModal } from './components/ProfileModal';
import { WorkoutTab } from './components/WorkoutTab';
import { SkillsTab } from './components/SkillsTab';

type ActiveTab = 'home' | CompanionId;

const PROFILE_STORAGE_KEY = 'lakshya_profile';
const TASKS_STORAGE_KEY = 'lakshya_mission_tasks';
const CHAT_STORAGE_PREFIX = 'lakshya_chat_';

const DEFAULT_MISSION_TASKS: MissionTask[] = [
  {
    id: 'task-1',
    title: 'Solve 15 timed JEE PYQs from current Physics/Maths chapter',
    tag: 'Problem Solving',
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Log every wrong or guessed question into my Mistake Notebook',
    tag: 'Error Analysis',
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Revise 1 page of Inorganic / Formula sheet before sleep',
    tag: 'Retention',
    completed: false,
  },
];

function loadInitialProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfile;
      if (parsed && parsed.name && parsed.goal) {
        const streakUpdate = calculateUpdatedStreak(parsed, new Date());
        const defaultProgress: Record<RoadmapStageId, boolean[]> = {
          foundation: [false, false, false],
          practice: [false, false, false],
          mocks: [false, false, false],
          sprint: [false, false, false],
          jeeday: [false, false, false],
        };
        const updated: UserProfile = {
          ...parsed,
          streak: streakUpdate.streak,
          lastVisit: streakUpdate.lastVisit,
          struggles:
            Array.isArray(parsed.struggles) && parsed.struggles.length > 0
              ? parsed.struggles
              : ([(parsed.struggle as StruggleType) || 'Consistency'] as StruggleType[]),
          studentClass: parsed.studentClass || 'Class 12',
          syllabusTarget: parsed.syllabusTarget || {
            month: 'November',
            year: '2026',
            timing: 'End of the month',
          },
          roadmapStage: parsed.roadmapStage || 'foundation',
          stageProgress: {
            ...defaultProgress,
            ...(parsed.stageProgress || {}),
          },
        };
        if (streakUpdate.changed) {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      }
    }

    // Support ?autostart=1 query param for automated testing
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const nowIso = new Date().toISOString();
      const seeded: UserProfile = {
        name: 'Aarav',
        goal: 'AIR under 500 in JEE Advanced — IIT Bombay CSE',
        examYear: '2027',
        struggle: 'Consistency',
        struggles: ['Consistency', 'Focus'],
        studentClass: 'Class 12',
        syllabusTarget: {
          month: 'November',
          year: '2026',
          timing: 'End of the month',
        },
        streak: 3,
        lastVisit: nowIso,
        createdAt: nowIso,
        roadmapStage: 'foundation',
        stageProgress: {
          foundation: [false, false, false],
          practice: [false, false, false],
          mocks: [false, false, false],
          sprint: [false, false, false],
          jeeday: [false, false, false],
        },
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
  } catch {
    // ignore storage errors
  }

  return null;
}

function loadChatHistory(companion: CompanionId): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${companion}`);
    if (raw) {
      return JSON.parse(raw) as ChatMessage[];
    }
  } catch {
    // ignore
  }
  return [];
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    loadInitialProfile()
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  const [chats, setChats] = useState<Record<CompanionId, ChatMessage[]>>(() => ({
    calm: loadChatHistory('calm'),
    now: loadChatHistory('now'),
    motivation: loadChatHistory('motivation'),
    mission: loadChatHistory('mission'),
    workout: loadChatHistory('workout'),
    skills: loadChatHistory('skills'),
  }));

  const [missionTasks, setMissionTasks] = useState<MissionTask[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_MISSION_TASKS;
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_MISSION_TASKS;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(missionTasks));
    } catch {
      // ignore
    }
  }, [missionTasks]);

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleUpdateMessages = (
    companion: CompanionId,
    newMessages: ChatMessage[]
  ) => {
    setChats((prev) => ({ ...prev, [companion]: newMessages }));
    try {
      localStorage.setItem(
        `${CHAT_STORAGE_PREFIX}${companion}`,
        JSON.stringify(newMessages)
      );
    } catch {
      // ignore
    }
  };

  const handleClearChat = (companion: CompanionId) => {
    setChats((prev) => ({ ...prev, [companion]: [] }));
    try {
      localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${companion}`);
    } catch {
      // ignore
    }
  };

  const handleSelectMood = (mood: MoodId) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      lastMood: mood,
      lastMoodDate: toLocalDateKey(new Date()),
    };
    handleSaveProfile(updated);
  };

  const handleUpdateRoadmapStage = (stage: RoadmapStageId) => {
    if (!profile) return;
    handleSaveProfile({ ...profile, roadmapStage: stage });
  };

  const handleToggleStageTask = (
    stage: RoadmapStageId,
    taskIndex: number
  ) => {
    if (!profile) return;
    const currentProgress = profile.stageProgress || {
      foundation: [false, false, false],
      practice: [false, false, false],
      mocks: [false, false, false],
      sprint: [false, false, false],
      jeeday: [false, false, false],
    };
    const stageArr = [...(currentProgress[stage] || [false, false, false])];
    stageArr[taskIndex] = !stageArr[taskIndex];
    handleSaveProfile({
      ...profile,
      stageProgress: {
        ...currentProgress,
        [stage]: stageArr,
      },
    });
  };

  const handleToggleMissionTask = (taskId: string) => {
    setMissionTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddMissionTask = (title: string) => {
    const newTask: MissionTask = {
      id: `task-${Date.now()}`,
      title,
      tag: 'Custom Target',
      completed: false,
    };
    setMissionTasks((prev) => [...prev, newTask]);
  };

  const handleResetMissionTasks = () => {
    setMissionTasks(
      DEFAULT_MISSION_TASKS.map((t) => ({ ...t, completed: false }))
    );
  };

  // Show Onboarding on first visit or when user launches the 4-step Setup Wizard
  if (!profile || isSetupWizardOpen) {
    return (
      <div className="relative min-h-screen text-[#dee1fa]">
        <StarfieldBackground />
        <Onboarding
          onComplete={(newProfile) => {
            handleSaveProfile(newProfile);
            setIsSetupWizardOpen(false);
          }}
        />
      </div>
    );
  }

  const countdown = calculateDaysToExam(profile.examYear);

  const navItems: {
    id: ActiveTab;
    label: string;
    roleDesc: string;
    icon: React.FC<{ className?: string }>;
    accentText: string;
    activeClass: string;
  }[] = [
    {
      id: 'home',
      label: 'Home',
      roleDesc: 'Command Deck',
      icon: HomeIcon,
      accentText: 'text-white',
      activeClass:
        'bg-[#7C5CFF]/20 border-[#7C5CFF] text-white shadow-[0_0_18px_rgba(124,92,255,0.2)]',
    },
    {
      id: 'calm',
      label: 'Calm',
      roleDesc: 'Stress Relief',
      icon: Wind,
      accentText: 'text-[#22D3EE]',
      activeClass:
        'bg-[#22D3EE]/18 border-[#22D3EE] text-[#22D3EE] shadow-[0_0_18px_rgba(34,211,238,0.2)]',
    },
    {
      id: 'now',
      label: 'Now',
      roleDesc: 'Action & Motivation',
      icon: Zap,
      accentText: 'text-[#cabeff]',
      activeClass:
        'bg-[#7C5CFF]/22 border-[#7C5CFF] text-white shadow-[0_0_18px_rgba(124,92,255,0.25)]',
    },
    {
      id: 'motivation',
      label: 'Motivation',
      roleDesc: 'Friend & Guide',
      icon: Heart,
      accentText: 'text-[#F472B6]',
      activeClass:
        'bg-[#F472B6]/20 border-[#F472B6] text-[#fbcfe8] shadow-[0_0_18px_rgba(244,114,182,0.24)]',
    },
    {
      id: 'mission',
      label: 'Mission',
      roleDesc: 'Roadmap & Why',
      icon: Compass,
      accentText: 'text-[#FFB020]',
      activeClass:
        'bg-[#FFB020]/18 border-[#FFB020] text-[#FFB020] shadow-[0_0_18px_rgba(255,176,32,0.22)]',
    },
    {
      id: 'workout',
      label: 'Workout',
      roleDesc: 'Bodyweight & BMI',
      icon: Dumbbell,
      accentText: 'text-[#22D3EE]',
      activeClass:
        'bg-[#22D3EE]/18 border-[#22D3EE] text-[#22D3EE] shadow-[0_0_18px_rgba(34,211,238,0.2)]',
    },
    {
      id: 'skills',
      label: 'Skills',
      roleDesc: 'Python, AI & More',
      icon: Code2,
      accentText: 'text-[#cabeff]',
      activeClass:
        'bg-[#7C5CFF]/22 border-[#7C5CFF] text-white shadow-[0_0_18px_rgba(124,92,255,0.25)]',
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row text-[#dee1fa]">
      <StarfieldBackground />

      {/* Desktop Left Flight-Nav Rail (280px persistent sidebar on 1024px+) */}
      <aside
        aria-label="Desktop Navigation Sidebar"
        className="hidden lg:flex lg:w-[280px] lg:shrink-0 lg:flex-col lg:justify-between orbital-glass-1 border-r border-[#2A3362] p-6 z-20 sticky top-0 h-screen"
      >
        <div className="space-y-8">
          {/* Brand Lockup */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C5CFF] to-[#22D3EE] flex items-center justify-center shadow-[0_0_20px_rgba(124,92,255,0.35)]">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold tracking-wider text-white text-lg block leading-none">
                  LAKSHYA
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  JEE / IIT Companion
                </span>
              </div>
            </button>
          </div>

          {/* Primary Navigation */}
          <nav aria-label="Main Navigation" className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[52px] px-4 py-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? item.activeClass
                      : 'border-transparent hover:bg-[#131938]/70 hover:border-[#2A3362] text-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? item.accentText : 'text-[#94A3B8]'
                      }`}
                    />
                    <div className="text-left">
                      <div className="font-display font-bold text-sm leading-tight">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">
                        {item.roleDesc}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Aspirant Telemetry Pod */}
        <div className="space-y-3 pt-6 border-t border-[#2A3362]/80">
          <div className="rounded-2xl bg-[#0A0E1F]/80 border border-[#2A3362] p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-display font-bold text-white truncate">
                {profile.name}
              </span>
              <span className="font-mono-num text-[#FFB020] font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                {profile.streak}d
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
              {profile.goal}
            </p>
            <div className="text-[11px] font-mono-num text-[#22D3EE] pt-1 border-t border-[#2A3362]/60">
              {countdown.daysRemaining} days to JEE {profile.examYear}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#131938] hover:bg-[#1b234d] border border-[#2A3362] text-xs font-display font-semibold text-[#CBD5E1] hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Edit profile</span>
          </button>
        </div>
      </aside>

      {/* Mobile Compact Top Header (Under 52px to respect 15% sticky budget) */}
      <header className="lg:hidden sticky top-0 z-30 h-13 px-4 orbital-glass-1 border-b border-[#2A3362] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C5CFF] to-[#22D3EE] flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold tracking-wider text-white text-sm">
            LAKSHYA
          </span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono-num text-[#FFB020] font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-current" />
            {profile.streak}d
          </span>
          <span aria-hidden="true" className="text-[#64748B]">
            ·
          </span>
          <span className="font-mono-num text-[#22D3EE] font-semibold">
            {countdown.daysRemaining}d left
          </span>
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            aria-label="Edit profile"
            className="px-2.5 py-1 rounded-full bg-[#131938] border border-[#2A3362] text-[11px] font-display font-semibold text-white cursor-pointer"
          >
            Profile
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-5 pb-24 lg:py-8">
        {activeTab === 'home' && (
          <Home
            profile={profile}
            onSelectCompanion={(c) => setActiveTab(c)}
            onOpenEditProfile={() => setIsProfileModalOpen(true)}
            onSelectMood={handleSelectMood}
          />
        )}

        {activeTab === 'calm' && (
          <ChatScreen
            companion="calm"
            color="cyan"
            title="Calm — Breathe & Reset"
            subtitle="Your quiet corner when mock scores sting, syllabus pressure builds, or you miss home. No lectures, no study schedules—just grounding relief."
            systemPrompt={buildCompanionSystemPrompt('calm', profile)}
            profile={profile}
            messages={chats.calm}
            onUpdateMessages={handleUpdateMessages}
            onClearChat={handleClearChat}
          />
        )}

        {activeTab === 'now' && (
          <ChatScreen
            companion="now"
            color="violet"
            title="Now — What Should I Do Right Now?"
            subtitle="Beat decision paralysis. Tell me how much time and battery you have left for ONE clear move, or switch to the Motivation chatbot right inside this tab."
            systemPrompt={buildCompanionSystemPrompt('now', profile)}
            profile={profile}
            messages={chats.now}
            motivationMessages={chats.motivation}
            onUpdateMessages={handleUpdateMessages}
            onClearChat={handleClearChat}
          />
        )}

        {activeTab === 'motivation' && (
          <ChatScreen
            companion="motivation"
            color="rose"
            title="Motivation — Your Lovely Friend, Teacher & Guide"
            subtitle={`Hey ${profile.name}, I'm here to listen to you like a best friend, explain & guide you like a caring teacher, and motivate you to achieve "${profile.goal}".`}
            systemPrompt={buildCompanionSystemPrompt('motivation', profile)}
            profile={profile}
            messages={chats.motivation}
            onUpdateMessages={handleUpdateMessages}
            onClearChat={handleClearChat}
          />
        )}

        {activeTab === 'mission' && (
          <ChatScreen
            companion="mission"
            color="gold"
            title="Mission — Guard Your North Star"
            subtitle="Break your JEE dream into concrete milestones, check off today’s 3 non-negotiable targets, and stay connected to why you started."
            systemPrompt={buildCompanionSystemPrompt('mission', profile)}
            profile={profile}
            messages={chats.mission}
            onUpdateMessages={handleUpdateMessages}
            onClearChat={handleClearChat}
            onUpdateStage={handleUpdateRoadmapStage}
            onToggleStageTask={handleToggleStageTask}
            missionTasks={missionTasks}
            onToggleTask={handleToggleMissionTask}
            onAddTask={handleAddMissionTask}
            onResetTasks={handleResetMissionTasks}
          />
        )}

        {activeTab === 'workout' && (
          <WorkoutTab
            profile={profile}
            onUpdateProfile={handleSaveProfile}
            messages={chats.workout}
            onUpdateMessages={handleUpdateMessages}
            onClearChat={handleClearChat}
          />
        )}

        {activeTab === 'skills' && (
          <SkillsTab
            profile={profile}
            onUpdateProfile={handleSaveProfile}
            messages={chats.skills}
            onUpdateMessages={handleUpdateMessages}
            onClearChat={handleClearChat}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 orbital-glass-1 border-t border-[#2A3362] grid grid-cols-7 items-center px-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isActive ? item.accentText : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-display font-semibold mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Edit Profile Modal */}
      <ProfileModal
        profile={profile}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        onRestartOnboarding={() => setIsSetupWizardOpen(true)}
      />
    </div>
  );
}
