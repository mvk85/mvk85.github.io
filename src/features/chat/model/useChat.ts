import { useCallback, useEffect, useMemo, useState } from 'react';

import { buildChatCompletionPayload } from '@/entities/chat/lib/buildPayload';
import { LIMIT_REACHED_TEXT, USER_MESSAGE_LIMIT } from '@/entities/chat/lib/constants';
import { initializeChatMessages, loadChatMessages, resetChatMessages, saveChatMessages } from '@/entities/chat/lib/storage';
import type { ChatMessage } from '@/entities/chat/model/types';
import type { ChatCompletionUsage } from '@/entities/chat-response/model/types';
import { openAiProxyChatApi } from '@/shared/api/openAiProxyChatApi';
import { normalizeError } from '@/shared/lib/errors';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
const CHAT_STATS_STORAGE_KEY = 'chat_stats_v1';

export type ChatStatsSnapshot = {
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCost: number | null;
};

export type ChatStatsItem = {
  id: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCost: number;
};

type ChatStatsState = {
  previousBalance: number | null;
  lastResponse: ChatStatsSnapshot;
  items: ChatStatsItem[];
  totalCost: number;
};

function createInitialStatsSnapshot(): ChatStatsSnapshot {
  return {
    model: null,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestCost: null,
  };
}

function createInitialStatsState(): ChatStatsState {
  return {
    previousBalance: null,
    lastResponse: createInitialStatsSnapshot(),
    items: [],
    totalCost: 0,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isChatStatsSnapshot(value: unknown): value is ChatStatsSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ChatStatsSnapshot>;
  return (
    (candidate.model === null || typeof candidate.model === 'string') &&
    isFiniteNumber(candidate.promptTokens) &&
    isFiniteNumber(candidate.completionTokens) &&
    isFiniteNumber(candidate.totalTokens) &&
    (candidate.requestCost === null || isFiniteNumber(candidate.requestCost))
  );
}

function isChatStatsItem(value: unknown): value is ChatStatsItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ChatStatsItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.model === 'string' &&
    isFiniteNumber(candidate.promptTokens) &&
    isFiniteNumber(candidate.completionTokens) &&
    isFiniteNumber(candidate.totalTokens) &&
    isFiniteNumber(candidate.requestCost)
  );
}

function loadChatStats(): ChatStatsState | null {
  const raw = localStorage.getItem(CHAT_STATS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const candidate = parsed as Partial<ChatStatsState>;
    if (!isChatStatsSnapshot(candidate.lastResponse)) {
      return null;
    }

    if (candidate.previousBalance !== null && !isFiniteNumber(candidate.previousBalance)) {
      return null;
    }

    if (candidate.items !== undefined && (!Array.isArray(candidate.items) || !candidate.items.every(isChatStatsItem))) {
      return null;
    }

    if (candidate.totalCost !== undefined && !isFiniteNumber(candidate.totalCost)) {
      return null;
    }

    return {
      previousBalance: candidate.previousBalance ?? null,
      lastResponse: candidate.lastResponse,
      items: candidate.items ?? [],
      totalCost: candidate.totalCost ?? 0,
    };
  } catch {
    return null;
  }
}

function saveChatStats(statsState: ChatStatsState): void {
  localStorage.setItem(CHAT_STATS_STORAGE_KEY, JSON.stringify(statsState));
}

function initializeChatStats(): ChatStatsState {
  const saved = loadChatStats();
  if (saved) {
    return saved;
  }

  const initialState = createInitialStatsState();
  saveChatStats(initialState);
  return initialState;
}

function resetChatStats(): ChatStatsState {
  localStorage.removeItem(CHAT_STATS_STORAGE_KEY);
  const initialState = createInitialStatsState();
  saveChatStats(initialState);
  return initialState;
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

function countUserMessages(messages: ChatMessage[]): number {
  return messages.filter((message) => message.role === 'user').length;
}

export function useChat() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => initializeChatMessages());
  const [statsState, setStatsState] = useState<ChatStatsState>(() => initializeChatStats());
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userMessageCount = useMemo(() => countUserMessages(messages), [messages]);
  const isLimitReached = userMessageCount >= USER_MESSAGE_LIMIT;

  const visibleMessages = useMemo(() => messages.filter((message) => message.role !== 'system'), [messages]);
  const limitNotice = isLimitReached ? LIMIT_REACHED_TEXT : null;

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

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: normalizedInput }];
    saveChatMessages(nextMessages);
    setMessages(nextMessages);
    setInputValue('');
    setStatus('loading');
    setErrorMessage(null);

    try {
      const balanceBefore = await (statsState.previousBalance === null
        ? openAiProxyChatApi.getBalance().catch(() => {
            throw new Error('Баланс не получен.');
          })
        : Promise.resolve(statsState.previousBalance));
      const historyFromStorage = loadChatMessages() ?? nextMessages;
      const payload = buildChatCompletionPayload(historyFromStorage);
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

      const freshHistory = loadChatMessages() ?? historyFromStorage;
      const assistantMessage: ChatMessage = { role: 'assistant', content: assistantText };
      const updatedMessages = [...freshHistory, assistantMessage];
      saveChatMessages(updatedMessages);
      setMessages(updatedMessages);

      const nextStatsState: ChatStatsState = {
        previousBalance: balanceAfter,
        lastResponse: {
          model: payload.model,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          requestCost,
        },
        items: [
          ...statsState.items,
          {
            id: `${response.id}-${Date.now()}`,
            model: payload.model,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            requestCost,
          },
        ],
        totalCost: statsState.totalCost + requestCost,
      };
      saveChatStats(nextStatsState);
      setStatsState(nextStatsState);
      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(normalizeError(error));
    }
  }, [inputValue, isLimitReached, messages, statsState, status]);

  const clearChat = useCallback(() => {
    const initialMessages = resetChatMessages();
    const initialStatsState = resetChatStats();
    setMessages(initialMessages);
    setStatsState(initialStatsState);
    setInputValue('');
    setStatus('idle');
    setErrorMessage(null);

    void refreshInitialBalance().catch(() => {
      setStatus('error');
      setErrorMessage('Баланс не получен.');
    });
  }, [refreshInitialBalance]);

  return {
    clearChat,
    errorMessage,
    inputValue,
    isLimitReached,
    isLoading: status === 'loading',
    limitNotice,
    messages: visibleMessages,
    lastResponseStats: statsState.lastResponse,
    statsItems: statsState.items,
    totalCost: statsState.totalCost,
    setInputValue,
    sendUserMessage,
    status,
    userMessageCount,
  };
}
