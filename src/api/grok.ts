import {
  CompanionId,
  UserProfile,
  ChatMessage,
  buildCompanionSystemPrompt,
} from '../utils/lakshyaLogic';
import {
  callGrok as callGrokBase,
  GROK_MODEL,
  COMPANION_TEMPERATURES,
} from '../../api/grok.js';

export { GROK_MODEL, COMPANION_TEMPERATURES };

export interface CallGrokOptions {
  systemPrompt?: string;
  companion: CompanionId;
  profile: UserProfile;
  messages: Pick<ChatMessage, 'role' | 'content'>[];
  purpose?: 'chat' | 'quote' | 'why-i-started' | 'food-macros';
  temperature?: number;
  stream?: boolean;
  onChunk?: (partialText: string) => void;
}

export interface CallGrokResult {
  reply: string;
  demoMode: boolean;
  model: string;
}

/**
 * Typed frontend wrapper around `callGrok` from `/api/grok.js`.
 * Automatically injects the companion's system prompt and recent chat history.
 */
export async function callGrok(options: CallGrokOptions): Promise<CallGrokResult> {
  const systemPrompt =
    options.systemPrompt ||
    buildCompanionSystemPrompt(options.companion, options.profile);

  const temperature =
    typeof options.temperature === 'number'
      ? options.temperature
      : COMPANION_TEMPERATURES[options.companion];

  // Keep last 10 messages so context feels personal without overflowing token budget
  const recentMessages = options.messages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const res = await callGrokBase({
    systemPrompt,
    messages: recentMessages,
    companion: options.companion,
    profile: options.profile,
    purpose: options.purpose || 'chat',
    temperature,
    stream: options.stream ?? true,
    onChunk: options.onChunk,
  });

  return {
    reply: String(res.reply || ''),
    demoMode: Boolean(res.demoMode),
    model: String(res.model || GROK_MODEL),
  };
}
