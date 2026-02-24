import { CHAT_STORAGE_KEY, DEFAULT_SYSTEM_PROMPT } from '@/entities/chat/lib/constants';
import type { ChatMessage } from '@/entities/chat/model/types';

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ChatMessage>;

  return (
    (candidate.role === 'system' || candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    candidate.content.trim().length > 0
  );
}

export function createInitialChatMessages(): ChatMessage[] {
  return [{ role: 'system', content: DEFAULT_SYSTEM_PROMPT }];
}

export function saveChatMessages(messages: ChatMessage[]): void {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

export function loadChatMessages(): ChatMessage[] | null {
  const raw = localStorage.getItem(CHAT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(isChatMessage)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function initializeChatMessages(): ChatMessage[] {
  const savedMessages = loadChatMessages();
  if (savedMessages) {
    return savedMessages;
  }

  const initialMessages = createInitialChatMessages();
  saveChatMessages(initialMessages);
  return initialMessages;
}

export function resetChatMessages(): ChatMessage[] {
  localStorage.removeItem(CHAT_STORAGE_KEY);
  const initialMessages = createInitialChatMessages();
  saveChatMessages(initialMessages);
  return initialMessages;
}

