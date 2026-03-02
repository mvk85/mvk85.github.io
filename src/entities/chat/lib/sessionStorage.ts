import { CHAT_SESSIONS_STORAGE_KEY } from '@/entities/chat/lib/constants';
import { loadChatMessages } from '@/entities/chat/lib/storage';
import { createEmptySummaryState, loadChatSummaryState } from '@/entities/chat/lib/summaryStorage';
import type { ChatContextStrategy, ChatMessage, ChatSession, ChatSessionsState, ChatSummaryState, ChatStrategySettings } from '@/entities/chat/model/types';

const DEFAULT_STRATEGY_1_WINDOW_SIZE = 10;
const DEFAULT_STRATEGY_2_WINDOW_SIZE = 10;

type StoredChatSession = {
  id?: unknown;
  createdAt?: unknown;
  parentChatId?: unknown;
  title?: unknown;
  messages?: unknown;
  summaryState?: unknown;
  contextStrategy?: unknown;
  strategySettings?: unknown;
};

type StoredChatSessionsState = {
  currentChat?: unknown;
  chatHistory?: unknown;
};

function isValidRole(value: unknown): value is ChatMessage['role'] {
  return value === 'user' || value === 'assistant';
}

function isValidContextStrategy(value: unknown): value is ChatContextStrategy {
  return value === 'strategy-1' || value === 'strategy-2' || value === 'strategy-3';
}

function normalizeStrategySettings(value: unknown): ChatStrategySettings {
  if (typeof value !== 'object' || value === null) {
    return {
      strategy1WindowSize: DEFAULT_STRATEGY_1_WINDOW_SIZE,
      strategy2WindowSize: DEFAULT_STRATEGY_2_WINDOW_SIZE,
      strategy2Facts: {},
    };
  }

  const candidate = value as Partial<ChatStrategySettings>;
  const strategy1WindowSize =
    typeof candidate.strategy1WindowSize === 'number' &&
    Number.isInteger(candidate.strategy1WindowSize) &&
    candidate.strategy1WindowSize > 0
      ? candidate.strategy1WindowSize
      : DEFAULT_STRATEGY_1_WINDOW_SIZE;

  const strategy2WindowSize =
    typeof candidate.strategy2WindowSize === 'number' &&
    Number.isInteger(candidate.strategy2WindowSize) &&
    candidate.strategy2WindowSize >= 0
      ? candidate.strategy2WindowSize
      : DEFAULT_STRATEGY_2_WINDOW_SIZE;

  const strategy2FactsSource =
    typeof candidate.strategy2Facts === 'object' && candidate.strategy2Facts !== null && !Array.isArray(candidate.strategy2Facts)
      ? candidate.strategy2Facts
      : {};
  const strategy2Facts = Object.entries(strategy2FactsSource).reduce<Record<string, string>>((accumulator, [key, rawValue]) => {
    if (key.trim().length === 0 || typeof rawValue !== 'string') {
      return accumulator;
    }

    accumulator[key.trim()] = rawValue.trim();
    return accumulator;
  }, {});

  return {
    strategy1WindowSize,
    strategy2WindowSize,
    strategy2Facts,
  };
}

function normalizeChatMessage(value: unknown, fallbackId: number): ChatMessage | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<ChatMessage>;

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

function normalizeSummaryState(value: unknown): ChatSummaryState {
  if (typeof value !== 'object' || value === null) {
    return createEmptySummaryState();
  }

  const candidate = value as Partial<ChatSummaryState>;
  const coveredUntilMessageId =
    candidate.coveredUntilMessageId === null ||
    (typeof candidate.coveredUntilMessageId === 'number' && Number.isInteger(candidate.coveredUntilMessageId) && candidate.coveredUntilMessageId > 0)
      ? candidate.coveredUntilMessageId
      : null;

  return {
    summaryText: typeof candidate.summaryText === 'string' ? candidate.summaryText : '',
    coveredUntilMessageId,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null,
  };
}

function createSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeChatTitle(messages: ChatMessage[]): string | undefined {
  const primaryMessage = messages.find((message) => message.role === 'user') ?? messages[0];
  if (!primaryMessage) {
    return undefined;
  }

  const compact = primaryMessage.content.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return undefined;
  }

  return compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
}

function getBaseChatTitle(chat: Pick<ChatSession, 'title' | 'messages'>): string {
  return chat.title ?? normalizeChatTitle(chat.messages) ?? 'Новый чат';
}

function getBranchNumberFromTitle(title: string, baseTitle: string): number | null {
  const prefix = `${baseTitle}_ветка_`;
  if (!title.startsWith(prefix)) {
    return null;
  }

  const suffix = title.slice(prefix.length).trim();
  if (!/^\d+$/.test(suffix)) {
    return null;
  }

  const branchNumber = Number(suffix);
  return Number.isInteger(branchNumber) && branchNumber > 0 ? branchNumber : null;
}

function getNextBranchNumber(baseTitle: string, parentChatId: string, chats: ChatSession[]): number {
  return (
    chats
      .filter((chat) => chat.parentChatId === parentChatId)
      .reduce((maxBranchNumber, chat) => {
        if (!chat.title) {
          return maxBranchNumber;
        }

        const branchNumber = getBranchNumberFromTitle(chat.title, baseTitle);
        return branchNumber === null ? maxBranchNumber : Math.max(maxBranchNumber, branchNumber);
      }, 0) + 1
  );
}

export function createChatSession(params?: {
  id?: string;
  createdAt?: string;
  parentChatId?: string | null;
  title?: string;
  messages?: ChatMessage[];
  summaryState?: ChatSummaryState;
  contextStrategy?: ChatContextStrategy;
  strategySettings?: ChatStrategySettings;
}): ChatSession {
  const messages = params?.messages ?? [];

  return {
    id: params?.id ?? createSessionId(),
    createdAt: params?.createdAt ?? new Date().toISOString(),
    parentChatId: typeof params?.parentChatId === 'string' ? params.parentChatId : null,
    title: params?.title,
    messages,
    summaryState: params?.summaryState ?? createEmptySummaryState(),
    contextStrategy: params?.contextStrategy ?? 'strategy-1',
    strategySettings: params?.strategySettings ?? {
      strategy1WindowSize: DEFAULT_STRATEGY_1_WINDOW_SIZE,
      strategy2WindowSize: DEFAULT_STRATEGY_2_WINDOW_SIZE,
      strategy2Facts: {},
    },
  };
}

function normalizeChatSession(value: unknown): ChatSession | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as StoredChatSession;
  if (typeof candidate.id !== 'string' || typeof candidate.createdAt !== 'string') {
    return null;
  }

  if (!Array.isArray(candidate.messages)) {
    return null;
  }

  const normalizedMessages: ChatMessage[] = [];
  for (let index = 0; index < candidate.messages.length; index += 1) {
    const message = normalizeChatMessage(candidate.messages[index], index + 1);
    if (message) {
      normalizedMessages.push(message);
    }
  }

  return {
    id: candidate.id,
    createdAt: candidate.createdAt,
    parentChatId: typeof candidate.parentChatId === 'string' ? candidate.parentChatId : null,
    title: typeof candidate.title === 'string' ? candidate.title : normalizeChatTitle(normalizedMessages),
    messages: normalizedMessages,
    summaryState: normalizeSummaryState(candidate.summaryState),
    contextStrategy: isValidContextStrategy(candidate.contextStrategy) ? candidate.contextStrategy : 'strategy-1',
    strategySettings: normalizeStrategySettings(candidate.strategySettings),
  };
}

export function prepareHistoryChat(chat: ChatSession): ChatSession {
  return {
    ...chat,
    parentChatId: chat.parentChatId ?? null,
    title: chat.title ?? normalizeChatTitle(chat.messages),
  };
}

export function createBranchedChatSession(parentChat: ChatSession, allChats: ChatSession[]): ChatSession {
  const branchMessages = parentChat.messages.map((message) => ({ ...message }));
  const baseTitle = getBaseChatTitle(parentChat);
  const branchNumber = getNextBranchNumber(baseTitle, parentChat.id, allChats);

  return createChatSession({
    parentChatId: parentChat.id,
    title: `${baseTitle}_ветка_${branchNumber}`,
    messages: branchMessages,
    summaryState: {
      ...parentChat.summaryState,
    },
    contextStrategy: parentChat.contextStrategy,
    strategySettings: {
      ...parentChat.strategySettings,
      strategy2Facts: {
        ...parentChat.strategySettings.strategy2Facts,
      },
    },
  });
}

export function saveChatSessionsState(state: ChatSessionsState): void {
  localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(state));
}

export function loadChatSessionsState(): ChatSessionsState | null {
  const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredChatSessionsState;
    const currentChat = normalizeChatSession(parsed.currentChat);
    if (!currentChat || !Array.isArray(parsed.chatHistory)) {
      return null;
    }

    const chatHistory = parsed.chatHistory.map((item) => normalizeChatSession(item)).filter((item): item is ChatSession => item !== null);

    return {
      currentChat,
      chatHistory,
    };
  } catch {
    return null;
  }
}

export function initializeChatSessionsState(): ChatSessionsState {
  const storedState = loadChatSessionsState();
  if (storedState) {
    return storedState;
  }

  const migratedMessages = loadChatMessages() ?? [];
  const migratedSummaryState = loadChatSummaryState() ?? createEmptySummaryState();

  const initialState: ChatSessionsState = {
    currentChat: createChatSession({
      messages: migratedMessages,
      summaryState: migratedSummaryState,
    }),
    chatHistory: [],
  };

  saveChatSessionsState(initialState);
  return initialState;
}

export function createEmptyChatSession(contextStrategy: ChatContextStrategy = 'strategy-1'): ChatSession {
  return createChatSession({
    contextStrategy,
    strategySettings: {
      strategy1WindowSize: DEFAULT_STRATEGY_1_WINDOW_SIZE,
      strategy2WindowSize: DEFAULT_STRATEGY_2_WINDOW_SIZE,
      strategy2Facts: {},
    },
  });
}
