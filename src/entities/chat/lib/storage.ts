import { CHAT_STORAGE_KEY } from '@/entities/chat/lib/constants';
import type { ChatMessage } from '@/entities/chat/model/types';

type StoredChatMessage = {
  id?: unknown;
  role?: unknown;
  content?: unknown;
  rag?: unknown;
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
  let rag: ChatMessage['rag'];
  if (typeof candidate.rag === 'object' && candidate.rag !== null && !Array.isArray(candidate.rag)) {
    const ragCandidate = candidate.rag as { used?: unknown; sources?: unknown };
    if (typeof ragCandidate.used === 'boolean' && Array.isArray(ragCandidate.sources)) {
      const normalizedSources = ragCandidate.sources
        .map((source) => {
          if (typeof source !== 'object' || source === null || Array.isArray(source)) {
            return null;
          }
          const candidateSource = source as {
            file?: unknown;
            section?: unknown;
            chunkId?: unknown;
            indexId?: unknown;
            score?: unknown;
            title?: unknown;
            strategy?: unknown;
          };
          if (
            typeof candidateSource.file !== 'string' ||
            typeof candidateSource.section !== 'string' ||
            typeof candidateSource.chunkId !== 'string' ||
            typeof candidateSource.indexId !== 'string' ||
            (candidateSource.score !== null && typeof candidateSource.score !== 'number') ||
            typeof candidateSource.title !== 'string' ||
            typeof candidateSource.strategy !== 'string'
          ) {
            return null;
          }
          return {
            file: candidateSource.file,
            section: candidateSource.section,
            chunkId: candidateSource.chunkId,
            indexId: candidateSource.indexId,
            score: typeof candidateSource.score === 'number' ? candidateSource.score : null,
            title: candidateSource.title,
            strategy: candidateSource.strategy,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      rag = {
        used: ragCandidate.used,
        sources: normalizedSources,
      };
    }
  }

  return {
    id,
    role: candidate.role,
    content: candidate.content.trim(),
    ...(rag ? { rag } : {}),
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
