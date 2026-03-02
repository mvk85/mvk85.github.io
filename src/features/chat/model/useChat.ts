import { useCallback, useEffect, useMemo, useState } from 'react';

import { buildChatCompletionPayload } from '@/entities/chat/lib/buildPayload';
import { buildContextByStrategy } from '@/entities/chat/lib/contextStrategies';
import { LIMIT_REACHED_TEXT, USER_MESSAGE_LIMIT } from '@/entities/chat/lib/constants';
import { createBranchedChatSession, createEmptyChatSession, initializeChatSessionsState, prepareHistoryChat, saveChatSessionsState } from '@/entities/chat/lib/sessionStorage';
import { getNextMessageId } from '@/entities/chat/lib/storage';
import type { ChatContextStrategy, ChatMessage, ChatSession, Strategy2Facts } from '@/entities/chat/model/types';
import type { ChatCompletionUsage } from '@/entities/chat-response/model/types';
import { openAiProxyChatApi } from '@/shared/api/openAiProxyChatApi';
import { env } from '@/shared/config/env';
import { normalizeError } from '@/shared/lib/errors';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
const CHAT_STATS_STORAGE_KEY = 'chat_stats_v1';
const FACT_EXTRACTOR_SYSTEM_PROMPT = `Ты извлекаешь из одного сообщения пользователя краткие факты для памяти диалога.
Верни только новые/уточнённые факты из ТЕКУЩЕГО сообщения.
Формат ответа: строго JSON-объект key-value, без пояснений и без markdown.
Ключи: короткие, snake_case, на английском.
Значения: кратко, на русском, 1 строка.
Если полезных фактов нет — верни {}.
Не добавляй предположения, только явно сказанное пользователем.
Если пользователь уточнил/изменил факт — верни ключ с новым значением.`;

type LegacyChatStatsSnapshot = {
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCost: number | null;
};

type ChatStatsPerChat = {
  model: string | null;
  totalCost: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

type ChatStatsState = {
  previousBalance: number | null;
  byChat: Record<string, ChatStatsPerChat>;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isLegacyChatStatsSnapshot(value: unknown): value is LegacyChatStatsSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<LegacyChatStatsSnapshot>;
  return (
    (candidate.model === null || typeof candidate.model === 'string') &&
    isFiniteNumber(candidate.promptTokens) &&
    isFiniteNumber(candidate.completionTokens) &&
    isFiniteNumber(candidate.totalTokens) &&
    (candidate.requestCost === null || isFiniteNumber(candidate.requestCost))
  );
}

function createInitialStatsPerChat(): ChatStatsPerChat {
  return {
    model: null,
    totalCost: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
}

function createInitialStatsState(): ChatStatsState {
  return {
    previousBalance: null,
    byChat: {},
  };
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

function isLegacyStatsItem(value: unknown): value is {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCost: number;
} {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<{
    model: unknown;
    promptTokens: unknown;
    completionTokens: unknown;
    totalTokens: unknown;
    requestCost: unknown;
  }>;
  return (
    typeof candidate.model === 'string' &&
    isFiniteNumber(candidate.promptTokens) &&
    isFiniteNumber(candidate.completionTokens) &&
    isFiniteNumber(candidate.totalTokens) &&
    isFiniteNumber(candidate.requestCost)
  );
}

function normalizePerChatStats(value: unknown): ChatStatsPerChat | null {
  if (isChatStatsPerChat(value)) {
    return value;
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const legacyCandidate = value as Partial<{
    lastResponse: unknown;
    items: unknown;
    totalCost: unknown;
    promptTokens: unknown;
    completionTokens: unknown;
    totalTokens: unknown;
  }>;

  if (!isLegacyChatStatsSnapshot(legacyCandidate.lastResponse)) {
    return null;
  }

  const legacyItems = Array.isArray(legacyCandidate.items) ? legacyCandidate.items.filter(isLegacyStatsItem) : [];
  const promptTokens = isFiniteNumber(legacyCandidate.promptTokens)
    ? legacyCandidate.promptTokens
    : legacyItems.reduce((sum, item) => sum + item.promptTokens, 0);
  const completionTokens = isFiniteNumber(legacyCandidate.completionTokens)
    ? legacyCandidate.completionTokens
    : legacyItems.reduce((sum, item) => sum + item.completionTokens, 0);
  const totalTokens = isFiniteNumber(legacyCandidate.totalTokens)
    ? legacyCandidate.totalTokens
    : legacyItems.reduce((sum, item) => sum + item.totalTokens, 0);
  const totalCost = isFiniteNumber(legacyCandidate.totalCost)
    ? legacyCandidate.totalCost
    : legacyItems.reduce((sum, item) => sum + item.requestCost, 0);

  return {
    model: legacyCandidate.lastResponse.model ?? legacyItems[legacyItems.length - 1]?.model ?? null,
    totalCost,
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

export function loadChatStats(defaultChatId: string): ChatStatsState | null {
  const raw = localStorage.getItem(CHAT_STATS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const candidate = parsed as Partial<ChatStatsState> & {
      lastResponse?: unknown;
      items?: unknown;
      totalCost?: unknown;
      promptTokens?: unknown;
      completionTokens?: unknown;
      totalTokens?: unknown;
      overall?: unknown;
    };

    if (candidate.byChat && typeof candidate.byChat === 'object' && !Array.isArray(candidate.byChat)) {
      const normalizedByChat: Record<string, ChatStatsPerChat> = {};

      for (const [chatId, chatStats] of Object.entries(candidate.byChat)) {
        const normalized = normalizePerChatStats(chatStats);
        if (normalized) {
          normalizedByChat[chatId] = normalized;
        }
      }

      return {
        previousBalance: candidate.previousBalance ?? null,
        byChat: normalizedByChat,
      };
    }

    if (
      isLegacyChatStatsSnapshot(candidate.lastResponse) &&
      Array.isArray(candidate.items) &&
      candidate.items.every((item) => isLegacyStatsItem(item)) &&
      isFiniteNumber(candidate.totalCost)
    ) {
      const migratedChatStats: ChatStatsPerChat = {
        model: candidate.lastResponse.model,
        totalCost: candidate.totalCost,
        promptTokens: isFiniteNumber(candidate.promptTokens)
          ? candidate.promptTokens
          : candidate.items.reduce((sum, item) => sum + (isLegacyStatsItem(item) ? item.promptTokens : 0), 0),
        completionTokens: isFiniteNumber(candidate.completionTokens)
          ? candidate.completionTokens
          : candidate.items.reduce((sum, item) => sum + (isLegacyStatsItem(item) ? item.completionTokens : 0), 0),
        totalTokens: isFiniteNumber(candidate.totalTokens)
          ? candidate.totalTokens
          : candidate.items.reduce((sum, item) => sum + (isLegacyStatsItem(item) ? item.totalTokens : 0), 0),
      };
      const byChat = { [defaultChatId]: migratedChatStats };

      return {
        previousBalance: candidate.previousBalance ?? null,
        byChat,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function saveChatStats(statsState: ChatStatsState): void {
  localStorage.setItem(CHAT_STATS_STORAGE_KEY, JSON.stringify(statsState));
}

function initializeChatStats(defaultChatId: string): ChatStatsState {
  const saved = loadChatStats(defaultChatId);
  if (saved) {
    return saved;
  }

  const initialState = createInitialStatsState();
  saveChatStats(initialState);
  return initialState;
}

function removeChatStats(statsState: ChatStatsState, chatId: string): ChatStatsState {
  const { [chatId]: _, ...restByChat } = statsState.byChat;
  return {
    ...statsState,
    byChat: restByChat,
  };
}

function getChatStats(state: ChatStatsState, chatId: string): ChatStatsPerChat {
  return state.byChat[chatId] ?? createInitialStatsPerChat();
}

function extractAssistantText(response: { choices?: Array<{ message?: { content?: string | null } }> }): string {
  const text = response.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Сервер вернул пустой ответ модели.');
  }

  return text;
}

function extractUsage(response: { usage?: ChatCompletionUsage }): ChatCompletionUsage {
  const usage = response.usage;
  if (!usage) {
    throw new Error('Сервер не вернул usage по токенам.');
  }

  if (!isFiniteNumber(usage.prompt_tokens) || !isFiniteNumber(usage.completion_tokens) || !isFiniteNumber(usage.total_tokens)) {
    throw new Error('Сервер вернул некорректные данные usage.');
  }

  return usage;
}

function normalizeFactKey(value: string): string {
  return value.trim();
}

function normalizeFactValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseFactsJson(rawText: string): Strategy2Facts {
  const trimmed = rawText.trim();
  const normalized =
    trimmed.startsWith('```') && trimmed.endsWith('```')
      ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new Error('Fact extractor вернул невалидный JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Fact extractor должен вернуть JSON-объект key-value.');
  }

  return Object.entries(parsed).reduce<Strategy2Facts>((accumulator, [rawKey, rawValue]) => {
    const key = normalizeFactKey(rawKey);
    const value = normalizeFactValue(rawValue);
    if (!key || value === null) {
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, {});
}

async function extractFactsForUserMessage(message: string): Promise<Strategy2Facts> {
  const payload = buildChatCompletionPayload(
    [
      { role: 'system', content: FACT_EXTRACTOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Извлеки факты из сообщения пользователя в формате JSON key-value.\n\nСообщение пользователя:\n${message}`,
      },
    ],
    env.llmModelMain,
  );
  const response = await openAiProxyChatApi.createChatCompletion(payload);
  const extractedFactsText = extractAssistantText(response);
  return parseFactsJson(extractedFactsText);
}

function countUserMessages(messages: ChatMessage[]): number {
  return messages.filter((message) => message.role === 'user').length;
}

function isChatEmpty(chat: ChatSession): boolean {
  return chat.messages.length === 0;
}

function removeChatById(history: ChatSession[], chatId: string): ChatSession[] {
  return history.filter((chat) => chat.id !== chatId);
}

function areChatsEqual(left: ChatSession, right: ChatSession): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function syncChatToHistory(history: ChatSession[], chat: ChatSession): ChatSession[] {
  const preparedChat = prepareHistoryChat(chat);
  const existingIndex = history.findIndex((historyChat) => historyChat.id === preparedChat.id);

  if (existingIndex === -1) {
    return [preparedChat, ...history];
  }

  if (areChatsEqual(history[existingIndex], preparedChat)) {
    return history;
  }

  const nextHistory = [...history];
  nextHistory[existingIndex] = preparedChat;
  return nextHistory;
}

export function useChat() {
  const initialSessionsState = useMemo(() => initializeChatSessionsState(), []);

  const [inputValue, setInputValue] = useState('');
  const [currentChat, setCurrentChat] = useState<ChatSession>(initialSessionsState.currentChat);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(initialSessionsState.chatHistory);
  const [statsState, setStatsState] = useState<ChatStatsState>(() => initializeChatStats(initialSessionsState.currentChat.id));
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messages = currentChat.messages;
  const currentChatStats = useMemo(() => getChatStats(statsState, currentChat.id), [currentChat.id, statsState]);

  const userMessageCount = useMemo(() => countUserMessages(messages), [messages]);
  const isLimitReached = userMessageCount >= USER_MESSAGE_LIMIT;
  const limitNotice = isLimitReached ? LIMIT_REACHED_TEXT : null;

  const persistSessions = useCallback((nextCurrentChat: ChatSession, nextChatHistory: ChatSession[]) => {
    saveChatSessionsState({
      currentChat: nextCurrentChat,
      chatHistory: nextChatHistory,
    });
    setCurrentChat(nextCurrentChat);
    setChatHistory(nextChatHistory);
  }, []);

  const refreshInitialBalance = useCallback(async () => {
    const currentBalance = await openAiProxyChatApi.getBalance();
    setStatsState((previousState) => {
      const nextState = {
        ...previousState,
        previousBalance: currentBalance,
      };
      saveChatStats(nextState);
      return nextState;
    });
  }, []);

  useEffect(() => {
    if (statsState.previousBalance !== null) {
      return;
    }

    void refreshInitialBalance().catch(() => {
      setStatus('error');
      setErrorMessage('Баланс не получен.');
    });
  }, [refreshInitialBalance, statsState.previousBalance]);

  const sendUserMessage = useCallback(async () => {
    const normalizedInput = inputValue.trim();

    if (!normalizedInput || status === 'loading' || isLimitReached) {
      return;
    }

    const userMessage: ChatMessage = {
      id: getNextMessageId(messages),
      role: 'user',
      content: normalizedInput,
    };

    const currentWithUserMessage: ChatSession = {
      ...currentChat,
      messages: [...messages, userMessage],
    };

    let nextHistoryState = syncChatToHistory(chatHistory, currentWithUserMessage);
    persistSessions(currentWithUserMessage, nextHistoryState);
    setInputValue('');
    setStatus('loading');
    setErrorMessage(null);

    try {
      const balanceBefore = await (statsState.previousBalance === null
        ? openAiProxyChatApi.getBalance().catch(() => {
            throw new Error('Баланс не получен.');
          })
        : Promise.resolve(statsState.previousBalance));

      let chatForRequest = currentWithUserMessage;
      if (currentWithUserMessage.contextStrategy === 'strategy-2') {
        const extractedFacts = await extractFactsForUserMessage(userMessage.content);
        const mergedFacts = {
          ...currentWithUserMessage.strategySettings.strategy2Facts,
          ...extractedFacts,
        };
        chatForRequest = {
          ...currentWithUserMessage,
          strategySettings: {
            ...currentWithUserMessage.strategySettings,
            strategy2Facts: mergedFacts,
          },
        };
        nextHistoryState = syncChatToHistory(nextHistoryState, chatForRequest);
        persistSessions(chatForRequest, nextHistoryState);
      }

      const contextMessages = buildContextByStrategy(
        chatForRequest.contextStrategy,
        chatForRequest.messages,
        chatForRequest.strategySettings,
      );
      console.info(
        `[context] strategy=${chatForRequest.contextStrategy}, strategy1WindowSize=${chatForRequest.strategySettings.strategy1WindowSize}, strategy2WindowSize=${chatForRequest.strategySettings.strategy2WindowSize}, strategy2Facts=${Object.keys(chatForRequest.strategySettings.strategy2Facts).length}, rawMessages=${chatForRequest.messages.length}, contextMessages=${contextMessages.length}`,
      );

      const payload = buildChatCompletionPayload(contextMessages, env.llmModelMain);
      const response = await openAiProxyChatApi.createChatCompletion(payload);
      const assistantText = extractAssistantText(response);
      const usage = extractUsage(response);
      const balanceAfter = await openAiProxyChatApi.getBalance().catch(() => {
        throw new Error('Баланс не получен.');
      });
      const requestCost = balanceBefore - balanceAfter;

      if (!isFiniteNumber(requestCost) || requestCost <= 0) {
        throw new Error('Ошибка расчета стоимости запроса: баланс не уменьшился.');
      }

      const assistantMessage: ChatMessage = {
        id: getNextMessageId(chatForRequest.messages),
        role: 'assistant',
        content: assistantText,
      };

      const updatedCurrentChat: ChatSession = {
        ...chatForRequest,
        messages: [...chatForRequest.messages, assistantMessage],
      };
      nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
      persistSessions(updatedCurrentChat, nextHistoryState);

      const nextStatsState: ChatStatsState = {
        ...statsState,
        previousBalance: balanceAfter,
        byChat: {
          ...statsState.byChat,
          [updatedCurrentChat.id]: {
            ...getChatStats(statsState, updatedCurrentChat.id),
            model: payload.model,
            totalCost: getChatStats(statsState, updatedCurrentChat.id).totalCost + requestCost,
            promptTokens: getChatStats(statsState, updatedCurrentChat.id).promptTokens + usage.prompt_tokens,
            completionTokens: getChatStats(statsState, updatedCurrentChat.id).completionTokens + usage.completion_tokens,
            totalTokens: getChatStats(statsState, updatedCurrentChat.id).totalTokens + usage.total_tokens,
          },
        },
      };
      saveChatStats(nextStatsState);
      setStatsState(nextStatsState);
      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(normalizeError(error));
    }
  }, [
    chatHistory,
    currentChat,
    inputValue,
    isLimitReached,
    messages,
    persistSessions,
    statsState,
    status,
  ]);

  const createNewChat = useCallback(
    (contextStrategy: ChatContextStrategy = 'strategy-1', options?: { discardCurrentChat?: boolean }) => {
      if (status === 'loading') {
        return;
      }

      const nextHistory = options?.discardCurrentChat
        ? removeChatById(chatHistory, currentChat.id)
        : isChatEmpty(currentChat)
          ? chatHistory
          : syncChatToHistory(chatHistory, currentChat);
      const nextCurrentChat = createEmptyChatSession(contextStrategy);

      persistSessions(nextCurrentChat, nextHistory);
      if (options?.discardCurrentChat) {
        setStatsState((previousState) => {
          const nextStatsState = removeChatStats(previousState, currentChat.id);
          saveChatStats(nextStatsState);
          return nextStatsState;
        });
      }
      setInputValue('');
      setStatus('idle');
      setErrorMessage(null);
    },
    [chatHistory, currentChat, persistSessions, status],
  );

  const createBranchFromCurrentChat = useCallback(() => {
    if (status === 'loading' || currentChat.contextStrategy !== 'strategy-3' || isChatEmpty(currentChat)) {
      return false;
    }

    const nextHistoryWithCurrent = syncChatToHistory(chatHistory, currentChat);
    const nextCurrentChat = createBranchedChatSession(currentChat, [currentChat, ...nextHistoryWithCurrent]);
    const nextHistory = syncChatToHistory(nextHistoryWithCurrent, nextCurrentChat);

    persistSessions(nextCurrentChat, nextHistory);
    setInputValue('');
    setStatus('idle');
    setErrorMessage(null);
    return true;
  }, [chatHistory, currentChat, persistSessions, status]);

  const setCurrentChatStrategy = useCallback(
    (contextStrategy: ChatContextStrategy) => {
      if (status === 'loading' || !isChatEmpty(currentChat) || currentChat.contextStrategy === contextStrategy) {
        return false;
      }

      const nextCurrentChat: ChatSession = {
        ...currentChat,
        contextStrategy,
      };

      persistSessions(nextCurrentChat, chatHistory);
      return true;
    },
    [chatHistory, currentChat, persistSessions, status],
  );

  const setStrategy1WindowSize = useCallback(
    (windowSize: number) => {
      if (status === 'loading' || !Number.isInteger(windowSize) || windowSize <= 0) {
        return false;
      }

      if (currentChat.strategySettings.strategy1WindowSize === windowSize) {
        return true;
      }

      const nextCurrentChat: ChatSession = {
        ...currentChat,
        strategySettings: {
          ...currentChat.strategySettings,
          strategy1WindowSize: windowSize,
        },
      };

      const nextHistory = chatHistory.map((chat) =>
        chat.id === nextCurrentChat.id
          ? {
              ...chat,
              strategySettings: nextCurrentChat.strategySettings,
            }
          : chat,
      );

      persistSessions(nextCurrentChat, nextHistory);
      return true;
    },
    [chatHistory, currentChat, persistSessions, status],
  );

  const setStrategy2WindowSize = useCallback(
    (windowSize: number) => {
      if (status === 'loading' || !Number.isInteger(windowSize) || windowSize < 0) {
        return false;
      }

      if (currentChat.strategySettings.strategy2WindowSize === windowSize) {
        return true;
      }

      const nextCurrentChat: ChatSession = {
        ...currentChat,
        strategySettings: {
          ...currentChat.strategySettings,
          strategy2WindowSize: windowSize,
        },
      };

      const nextHistory = chatHistory.map((chat) =>
        chat.id === nextCurrentChat.id
          ? {
              ...chat,
              strategySettings: nextCurrentChat.strategySettings,
            }
          : chat,
      );

      persistSessions(nextCurrentChat, nextHistory);
      return true;
    },
    [chatHistory, currentChat, persistSessions, status],
  );

  const switchToHistoryChat = useCallback(
    (chatId: string) => {
      if (status === 'loading') {
        return;
      }

      const selectedChat = chatHistory.find((chat) => chat.id === chatId);
      if (!selectedChat) {
        return;
      }

      const nextHistory = isChatEmpty(currentChat) ? chatHistory : syncChatToHistory(chatHistory, currentChat);

      persistSessions(selectedChat, nextHistory);
      setInputValue('');
      setStatus('idle');
      setErrorMessage(null);
    },
    [chatHistory, currentChat, persistSessions, status],
  );

  const deleteHistoryChat = useCallback(
    (chatId: string) => {
      const nextHistory = removeChatById(chatHistory, chatId);
      if (nextHistory.length === chatHistory.length) {
        return;
      }

      if (chatId === currentChat.id) {
        persistSessions(createEmptyChatSession(), nextHistory);
        setStatsState((previousState) => {
          const nextStatsState = removeChatStats(previousState, chatId);
          saveChatStats(nextStatsState);
          return nextStatsState;
        });
        setInputValue('');
        setStatus('idle');
        setErrorMessage(null);
        return;
      }

      persistSessions(currentChat, nextHistory);
      setStatsState((previousState) => {
        const nextStatsState = removeChatStats(previousState, chatId);
        saveChatStats(nextStatsState);
        return nextStatsState;
      });
    },
    [chatHistory, currentChat, persistSessions],
  );

  const clearChat = useCallback(() => {
    const nextCurrentChat = createEmptyChatSession();
    const nextHistory = removeChatById(chatHistory, currentChat.id);
    persistSessions(nextCurrentChat, nextHistory);

    setStatsState((previousState) => {
      const nextStatsState = removeChatStats(previousState, currentChat.id);
      saveChatStats(nextStatsState);
      return nextStatsState;
    });
    setInputValue('');
    setStatus('idle');
    setErrorMessage(null);

    void refreshInitialBalance().catch(() => {
      setStatus('error');
      setErrorMessage('Баланс не получен.');
    });
  }, [chatHistory, currentChat.id, persistSessions, refreshInitialBalance]);

  return {
    canCreateBranchFromCurrentChat: status !== 'loading' && currentChat.contextStrategy === 'strategy-3' && !isChatEmpty(currentChat),
    clearChat,
    chatHistory,
    createBranchFromCurrentChat,
    createNewChat,
    currentChatStrategy: currentChat.contextStrategy,
    currentStrategy1WindowSize: currentChat.strategySettings.strategy1WindowSize,
    currentStrategy2WindowSize: currentChat.strategySettings.strategy2WindowSize,
    currentChatId: currentChat.id,
    deleteHistoryChat,
    errorMessage,
    inputValue,
    isLimitReached,
    isLoading: status === 'loading',
    limitNotice,
    messages,
    model: currentChatStats.model ?? env.llmModelMain,
    promptTokens: currentChatStats.promptTokens,
    completionTokens: currentChatStats.completionTokens,
    totalTokens: currentChatStats.totalTokens,
    setCurrentChatStrategy,
    setStrategy1WindowSize,
    setStrategy2WindowSize,
    setInputValue,
    sendUserMessage,
    status,
    switchToHistoryChat,
    totalCost: currentChatStats.totalCost,
    userMessageCount,
  };
}
