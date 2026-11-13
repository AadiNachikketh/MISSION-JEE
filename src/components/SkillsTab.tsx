import React, { useState } from 'react';
import {
  Code2,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import {
  ChatMessage,
  CompanionId,
  SkillItem,
  UserProfile,
  buildCompanionSystemPrompt,
} from '../utils/lakshyaLogic';
import { ChatScreen } from './ChatScreen';

interface SkillsTabProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  messages: ChatMessage[];
  onUpdateMessages: (companion: CompanionId, msgs: ChatMessage[]) => void;
  onClearChat: (companion: CompanionId) => void;
}

const EXAMPLE_SKILLS = [
  { name: 'Python & AI', category: 'Coding & AI' },
  { name: 'Video Editing & Motion Graphics', category: 'Creative Media' },
  { name: 'Web App Development (React)', category: 'Software Eng' },
  { name: 'UI/UX & Product Design', category: 'Design' },
  { name: 'Machine Learning Basics', category: 'Coding & AI' },
  { name: 'Public Speaking & Communication', category: 'Life Skill' },
];

export const SkillsTab: React.FC<SkillsTabProps> = ({
  profile,
  onUpdateProfile,
  messages,
  onUpdateMessages,
  onClearChat,
}) => {
  const [skillInput, setSkillInput] = useState('');
  const [skillCategory, setSkillCategory] = useState('Coding & AI');

  const skills: SkillItem[] = profile.skills || [];

  const handleAddSkill = (nameToAdd: string, cat: string = skillCategory) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (
      skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setSkillInput('');
      return;
    }

    const newSkill: SkillItem = {
      id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      category: cat,
      sessionsCompleted: 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateProfile({
      ...profile,
      skills: [...skills, newSkill],
    });
    setSkillInput('');
  };

  const handleIncrementSession = (id: string) => {
    onUpdateProfile({
      ...profile,
      skills: skills.map((s) =>
        s.id === id
          ? { ...s, sessionsCompleted: (s.sessionsCompleted || 0) + 1 }
          : s
      ),
    });
  };

  const handleDeleteSkill = (id: string) => {
    onUpdateProfile({
      ...profile,
      skills: skills.filter((s) => s.id !== id),
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Skill Builder Card */}
      <div className="orbital-glass-2 rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#cabeff]">
              <Code2 className="w-4 h-4 text-[#7C5CFF]" />
              <span>Skill Incubator &amp; AI Learning Lab</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-0.5">
              Skills I Want to Learn
            </h1>
            <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1">
              Add anything you want to master—Python, AI, Video Editing, Design, or Coding—and let your Skills AI Mentor guide you in 25-minute micro-sessions.
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-[#7C5CFF]/20 border border-[#7C5CFF]/50 text-xs font-mono-num font-bold text-[#cabeff]">
            {skills.length} {skills.length === 1 ? 'Skill' : 'Skills'} Active
          </span>
        </div>

        {/* Add Skill Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddSkill(skillInput, skillCategory);
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
        >
          <div className="sm:col-span-7">
            <label htmlFor="add-skill-input" className="sr-only">
              Add a skill you want to learn
            </label>
            <input
              id="add-skill-input"
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Type a skill to learn (e.g., Python AI, Video Editing, Blender 3D)..."
              className="w-full h-11 px-4 rounded-xl bg-[#0A0E1F] border border-[#2A3362] focus:border-[#7C5CFF] focus:outline-none text-xs sm:text-sm text-white placeholder-[#64748B]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              aria-label="Skill category"
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#0A0E1F] border border-[#2A3362] text-xs text-white font-display font-semibold"
            >
              <option value="Coding & AI">Coding &amp; AI</option>
              <option value="Creative Media">Creative &amp; Editing</option>
              <option value="Software Eng">Web &amp; Apps</option>
              <option value="Design">UI/UX &amp; 3D Design</option>
              <option value="Life Skill">Communication &amp; Other</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              data-testid="add-skill-btn"
              className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#7C5CFF] to-[#633BF3] text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>
        </form>

        {/* Quick Example Skill Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-display font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB020]" />
            <span>Tap to add popular skills:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SKILLS.map((ex) => (
              <button
                key={ex.name}
                type="button"
                onClick={() => handleAddSkill(ex.name, ex.category)}
                className="px-3 py-1.5 rounded-full bg-[#131938] hover:bg-[#1e2756] border border-[#2A3362] text-xs text-[#CBD5E1] cursor-pointer transition-colors"
              >
                + {ex.name}
              </button>
            ))}
          </div>
        </div>

        {/* Added Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {skills.length === 0 ? (
            <div className="col-span-full p-5 rounded-2xl bg-[#0A0E1F]/65 border border-[#2A3362] text-center text-xs text-[#94A3B8]">
              No skills added yet. Type a skill like &ldquo;Python AI&rdquo; or &ldquo;Video Editing&rdquo; above to start tracking!
            </div>
          ) : (
            skills.map((skill) => (
              <div
                key={skill.id}
                data-testid="skill-card-item"
                className="p-4 rounded-2xl bg-[#0A0E1F]/85 border border-[#2A3362] flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-wider text-[#22D3EE]">
                      <Layers className="w-3 h-3" />
                      <span>{skill.category}</span>
                    </span>
                    <h3 className="text-sm sm:text-base font-display font-bold text-white mt-0.5">
                      {skill.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSkill(skill.id)}
                    aria-label={`Remove ${skill.name}`}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#ffb4ab] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2A3362]/70">
                  <span className="text-xs font-mono-num text-[#FFB020] font-semibold">
                    {skill.sessionsCompleted || 0} sessions done
                  </span>
                  <button
                    type="button"
                    onClick={() => handleIncrementSession(skill.id)}
                    className="min-h-[34px] px-3 py-1 rounded-full bg-[#7C5CFF]/20 hover:bg-[#7C5CFF]/35 border border-[#7C5CFF]/50 text-xs font-display font-bold text-white flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>+1 Session</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Embedded Skills AI Mentor Chat */}
      <ChatScreen
        companion="skills"
        color="violet"
        title="Skills AI Mentor — Learn Anything Step-by-Step"
        subtitle={`Ask your Skills AI Mentor to teach you ${
          skills.length > 0
            ? skills.map((s) => s.name).join(', ')
            : 'Python, AI, Video Editing, or any skill'
        } in bite-sized 25-minute lessons alongside your JEE prep!`}
        systemPrompt={buildCompanionSystemPrompt('skills', profile)}
        profile={profile}
        messages={messages}
        onUpdateMessages={onUpdateMessages}
        onClearChat={onClearChat}
      />
    </div>
  );
};
