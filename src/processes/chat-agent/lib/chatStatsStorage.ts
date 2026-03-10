import type { ChatStatsPerChat, ChatStatsState } from '@/processes/chat-agent/model/types';

const CHAT_STATS_STORAGE_KEY = 'chat_stats_v1';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isChatStatsPerChat(value: unknown): value is ChatStatsPerChat {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ChatStatsPerChat>;
  return (
    (candidate.model === null || typeof candidate.model === 'string') &&
    isFiniteNumber(candidate.totalCost) &&
    isFiniteNumber(candidate.promptTokens) &&
    isFiniteNumber(candidate.completionTokens) &&
    isFiniteNumber(candidate.totalTokens)
  );
}

export function createInitialStatsPerChat(): ChatStatsPerChat {
  return {
    model: null,
    totalCost: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
}

export function createInitialStatsState(): ChatStatsState {
  return {
    previousBalance: null,
    byChat: {},
  };
}

export function getChatStats(state: ChatStatsState, chatId: string): ChatStatsPerChat {
  return state.byChat[chatId] ?? createInitialStatsPerChat();
}

export function loadChatStats(defaultChatId: string): ChatStatsState | null {
  void defaultChatId;
  const raw = localStorage.getItem(CHAT_STATS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Некорректный формат chat stats: ожидается объект.');
  }

  const candidate = parsed as Partial<ChatStatsState>;
  if (!candidate.byChat || typeof candidate.byChat !== 'object' || Array.isArray(candidate.byChat)) {
    throw new Error('Некорректный формат chat stats: отсутствует byChat.');
  }
  if (!(candidate.previousBalance === null || candidate.previousBalance === undefined || isFiniteNumber(candidate.previousBalance))) {
    throw new Error('Некорректный формат chat stats: previousBalance должен быть number|null.');
  }

  const normalizedByChat: Record<string, ChatStatsPerChat> = {};
  for (const [chatId, chatStats] of Object.entries(candidate.byChat)) {
    if (!isChatStatsPerChat(chatStats)) {
      throw new Error(`Некорректный формат chat stats для чата "${chatId}".`);
    }
    normalizedByChat[chatId] = chatStats;
  }

  return {
    previousBalance: candidate.previousBalance ?? null,
    byChat: normalizedByChat,
  };
}

export function initializeChatStats(defaultChatId: string): ChatStatsState {
  const saved = loadChatStats(defaultChatId);
  if (saved) {
    return saved;
  }

  const initialState = createInitialStatsState();
  saveChatStats(initialState);
  return initialState;
}

export function saveChatStats(statsState: ChatStatsState): void {
  localStorage.setItem(CHAT_STATS_STORAGE_KEY, JSON.stringify(statsState));
}

export function removeChatStats(statsState: ChatStatsState, chatId: string): ChatStatsState {
  const { [chatId]: _, ...restByChat } = statsState.byChat;
  return {
    ...statsState,
    byChat: restByChat,
  };
}
