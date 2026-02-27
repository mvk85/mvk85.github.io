import { CHAT_STORAGE_KEY } from '@/entities/chat/lib/constants';
import type { ChatMessage } from '@/entities/chat/model/types';

type StoredChatMessage = {
  id?: unknown;
  role?: unknown;
  content?: unknown;
};

function isValidRole(value: unknown): value is ChatMessage['role'] {
  return value === 'user' || value === 'assistant';
}

function normalizeChatMessage(value: unknown, fallbackId: number): ChatMessage | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as StoredChatMessage;

  if (!isValidRole(candidate.role) || typeof candidate.content !== 'string' || candidate.content.trim().length === 0) {
    return null;
  }

  const id = typeof candidate.id === 'number' && Number.isInteger(candidate.id) && candidate.id > 0 ? candidate.id : fallbackId;

  return {
    id,
    role: candidate.role,
    content: candidate.content.trim(),
  };
}

export function createInitialChatMessages(): ChatMessage[] {
  return [];
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
    if (!Array.isArray(parsed)) {
      return null;
    }

    const normalized: ChatMessage[] = [];
    for (let index = 0; index < parsed.length; index += 1) {
      const message = normalizeChatMessage(parsed[index], index + 1);
      if (!message) {
        continue;
      }
      normalized.push(message);
    }

    return normalized;
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

export function getNextMessageId(messages: ChatMessage[]): number {
  const lastMessage = messages[messages.length - 1];
  return lastMessage ? lastMessage.id + 1 : 1;
}
