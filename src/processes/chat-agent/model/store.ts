import { createStore, type StoreApi } from 'zustand/vanilla';

import { buildChatCompletionPayload } from '@/entities/chat/lib/buildPayload';
import { buildContextByStrategy } from '@/entities/chat/lib/contextStrategies';
import { LIMIT_REACHED_TEXT, USER_MESSAGE_LIMIT } from '@/entities/chat/lib/constants';
import { loadLongTermMemory, resetLongTermMemory, saveLongTermMemory } from '@/entities/chat/lib/longTermMemoryStorage';
import {
  buildLongTermMemoryExtractionMessages,
  buildWorkingMemoryExtractionMessages,
  parseLongTermMemory,
  parseWorkingMemory,
  prependMemoryToContext,
} from '@/entities/chat/lib/memoryService';
import {
  createBranchedChatSession,
  createEmptyChatSession,
  initializeChatSessionsStateWithDiagnostics,
  prepareHistoryChat,
  saveChatSessionsState,
} from '@/entities/chat/lib/sessionStorage';
import { getNextMessageId } from '@/entities/chat/lib/storage';
import { createFrontendPromptInitialTaskState, isTaskEnabled } from '@/entities/chat/lib/taskConfig';
import { runFrontendPromptTaskTurn } from '@/entities/chat/lib/taskWorkflow';
import { deleteWorkingMemoryForChat, loadWorkingMemoryByChat, saveWorkingMemoryByChat } from '@/entities/chat/lib/workingMemoryStorage';
import type { ChatContextStrategy, ChatMessage, ChatSession, ChatTaskId, Strategy2Facts, WorkingMemory } from '@/entities/chat/model/types';
import type { ChatCompletionUsage } from '@/entities/chat-response/model/types';
import { prependUserProfileToContext } from '@/entities/profile/lib/profilePrompt';
import type { UserProfileId } from '@/entities/profile/model/types';
import { FACT_EXTRACTOR_SYSTEM_PROMPT } from '@/processes/chat-agent/config/prompts';
import { prependOrganizerSchedulerToContext } from '@/processes/chat-agent/lib/organizerSchedulerPrompt';
import {
  formatMcpDisabledForSchedulerMessage,
  getSchedulerActionQuestion,
  getSchedulerIntervalQuestion,
  getSchedulerRepeatQuestion,
  getSchedulerWizardIntroMessage,
  parseOrganizerSchedulerCommand,
} from '@/processes/chat-agent/lib/organizerSchedulerRuntime';
import { loadScheduledEvents, saveScheduledEvents } from '@/processes/chat-agent/lib/schedulerStorage';
import { loadMcpGithubEnabled, prependMcpGithubToContext } from '@/processes/chat-agent/lib/mcpGithubPrompt';
import { resolveMcpGithubAssistantText } from '@/processes/chat-agent/lib/mcpGithubRuntime';
import { getChatStats, initializeChatStats, removeChatStats, saveChatStats } from '@/processes/chat-agent/lib/chatStatsStorage';
import type { ChatAgentState, ChatStatsState, RequestStatus } from '@/processes/chat-agent/model/types';
import type { ScheduledEvent } from '@/processes/chat-agent/model/schedulerTypes';
import { HttpError } from '@/shared/api/client';
import { openAiProxyChatApi } from '@/shared/api/openAiProxyChatApi';
import { env } from '@/shared/config/env';
import { CHAT_MODEL_OPTIONS, type ChatModel } from '@/shared/config/llmModels';
import { normalizeError } from '@/shared/lib/errors';

type ChatAgentActions = {
  setInputValue: (value: string) => void;
  sendUserMessage: () => Promise<void>;
  createNewChat: (contextStrategy?: ChatContextStrategy, options?: { discardCurrentChat?: boolean }) => void;
  createBranchFromCurrentChat: () => boolean;
  setCurrentChatStrategy: (contextStrategy: ChatContextStrategy) => boolean;
  setCurrentChatProfile: (profileId: UserProfileId) => boolean;
  setCurrentChatModel: (model: ChatModel) => boolean;
  setCurrentChatTask: (taskId: ChatTaskId) => boolean;
  setCurrentTaskInvariantsEnabled: (enabled: boolean) => boolean;
  setStrategy1WindowSize: (windowSize: number) => boolean;
  setStrategy2WindowSize: (windowSize: number) => boolean;
  switchToHistoryChat: (chatId: string) => void;
  deleteHistoryChat: (chatId: string) => void;
  deleteScheduledEvent: (eventId: string) => void;
  clearChat: () => void;
  clearLongTermMemory: () => void;
  refreshInitialBalance: () => Promise<void>;
};

export type ChatAgentStoreState = ChatAgentState & ChatAgentActions;

function createEmptyUsage(): ChatCompletionUsage {
  return {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };
}

function addUsage(left: ChatCompletionUsage, right: ChatCompletionUsage): ChatCompletionUsage {
  return {
    prompt_tokens: left.prompt_tokens + right.prompt_tokens,
    completion_tokens: left.completion_tokens + right.completion_tokens,
    total_tokens: left.total_tokens + right.total_tokens,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isServerHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError && error.status >= 400 && error.status < 600;
}

function resolveRequestCost(balanceBefore: number, balanceAfter: number): number {
  const requestCost = balanceBefore - balanceAfter;
  if (!isFiniteNumber(requestCost) || requestCost <= 0) {
    console.warn('[chat-agent] cost calculation skipped: balance did not decrease', {
      balanceBefore,
      balanceAfter,
      requestCost,
    });
    return 0;
  }

  return requestCost;
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

function extractUsageSafe(response: { usage?: ChatCompletionUsage }): ChatCompletionUsage {
  try {
    return extractUsage(response);
  } catch {
    return createEmptyUsage();
  }
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
    const key = rawKey.trim();
    const value = normalizeFactValue(rawValue);
    if (!key || value === null) {
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, {});
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

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  return false;
}

function resolveChatModel(statsState: ChatStatsState, chatId: string): ChatModel {
  const currentModel = getChatStats(statsState, chatId).model;
  if (currentModel && CHAT_MODEL_OPTIONS.includes(currentModel as ChatModel)) {
    return currentModel as ChatModel;
  }

  if (CHAT_MODEL_OPTIONS.includes(env.llmModelMain as ChatModel)) {
    return env.llmModelMain as ChatModel;
  }

  return CHAT_MODEL_OPTIONS[0];
}

function createScheduledEventId(): string {
  return `sched_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toLowerTrimmed(value: string): string {
  return value.trim().toLowerCase();
}

function formatSchedulerCreatedMessage(event: ScheduledEvent): string {
  const repeatText = event.repeat.mode === 'always' ? 'всегда' : `${event.repeat.totalRuns}`;
  return `Запланированное действие создано.\nДействие: ${event.action}\nПовторений: ${repeatText}\nИнтервал: ${event.intervalSeconds} сек.\nВ левой панели можно увидеть запланированное действие.`;
}

function buildSchedulerResultMessage(action: string, result: string): string {
  return `Сработал планировщик "${action}".\nРезультат:\n${result}`;
}

function buildSchedulerErrorMessage(action: string, errorText: string): string {
  return `Планировщик "${action}" завершился с ошибкой: ${errorText}`;
}

export function createChatAgentStore(): StoreApi<ChatAgentStoreState> {
  const initialSessionsStateDiagnostics = initializeChatSessionsStateWithDiagnostics();
  const initialSessionsState = initialSessionsStateDiagnostics.state;
  const initialScheduledEvents = loadScheduledEvents();
  let initialStatsErrorMessage: string | null = null;
  let initialStatsState: ChatStatsState;
  try {
    initialStatsState = initializeChatStats(initialSessionsState.currentChat.id);
  } catch (error: unknown) {
    initialStatsState = {
      previousBalance: null,
      byChat: {},
    };
    initialStatsErrorMessage = normalizeError(error);
  }
  let requestSequence = 0;
  let activeController: AbortController | null = null;
  let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
  let schedulerQueueActive = false;

  const store = createStore<ChatAgentStoreState>((set, get) => {
    const persistSessions = (nextCurrentChat: ChatSession, nextChatHistory: ChatSession[]) => {
      saveChatSessionsState({
        currentChat: nextCurrentChat,
        chatHistory: nextChatHistory,
      });
      set({
        currentChat: nextCurrentChat,
        chatHistory: nextChatHistory,
      });
    };

    const persistWorkingMemoryByChat = (nextMemoryMap: Record<string, WorkingMemory>) => {
      saveWorkingMemoryByChat(nextMemoryMap);
      set({
        workingMemoryByChat: nextMemoryMap,
      });
    };

    const persistLongTermMemory = (nextLongTermMemory: ChatAgentStoreState['longTermMemory']) => {
      saveLongTermMemory(nextLongTermMemory);
      set({
        longTermMemory: nextLongTermMemory,
      });
    };

    const persistScheduledEvents = (nextScheduledEvents: ScheduledEvent[]) => {
      const sorted = [...nextScheduledEvents].sort((left, right) => new Date(left.nextRunAt).getTime() - new Date(right.nextRunAt).getTime());
      saveScheduledEvents(sorted);
      set({
        scheduledEvents: sorted,
      });
    };

    const appendAssistantMessageToCurrentChat = (content: string) => {
      const currentState = get();
      const assistantMessage: ChatMessage = {
        id: getNextMessageId(currentState.currentChat.messages),
        role: 'assistant',
        content,
      };
      const nextCurrentChat: ChatSession = {
        ...currentState.currentChat,
        messages: [...currentState.currentChat.messages, assistantMessage],
      };
      const nextHistory = syncChatToHistory(currentState.chatHistory, nextCurrentChat);
      persistSessions(nextCurrentChat, nextHistory);
    };

    const startSchedulerWizard = (): string => {
      set({
        schedulerWizard: {
          step: 'repeat',
          repeat: null,
          intervalSeconds: null,
        },
      });
      return getSchedulerWizardIntroMessage();
    };

    const resolveAssistantCommandText = async (
      rawAssistantText: string,
      signal: AbortSignal | undefined,
      allowSchedulerWizardStart: boolean,
    ): Promise<string | null> => {
      const organizerCommand = parseOrganizerSchedulerCommand(rawAssistantText);
      if (organizerCommand) {
        if (!loadMcpGithubEnabled()) {
          return formatMcpDisabledForSchedulerMessage();
        }
        if (!allowSchedulerWizardStart) {
          return '';
        }
        return startSchedulerWizard();
      }

      const mcpResolved = await resolveMcpGithubAssistantText(rawAssistantText, signal);
      const organizerFromMcp = parseOrganizerSchedulerCommand(mcpResolved);
      if (organizerFromMcp) {
        if (!loadMcpGithubEnabled()) {
          return formatMcpDisabledForSchedulerMessage();
        }
        if (!allowSchedulerWizardStart) {
          return '';
        }
        return startSchedulerWizard();
      }

      return mcpResolved;
    };

    const scheduleSchedulerTimer = () => {
      if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
      }

      const state = get();
      if (state.scheduledEvents.length === 0) {
        return;
      }

      const now = Date.now();
      const nextRunTime = Math.min(...state.scheduledEvents.map((event) => new Date(event.nextRunAt).getTime()));
      const hasPastEvent = nextRunTime <= now;
      const delay = hasPastEvent && state.status === 'loading' ? 1000 : Math.max(0, nextRunTime - now);
      schedulerTimer = setTimeout(() => {
        void runDueScheduledEvents();
      }, Math.min(delay, 2_147_483_647));
    };

    const runScheduledEvent = async (event: ScheduledEvent) => {
      const selectedModel = resolveChatModel(get().statsState, get().currentChat.id);
      const signal = new AbortController().signal;
      const contextWithProfile = prependUserProfileToContext([{ role: 'user', content: event.action }], get().currentChat.profileId);
      const contextWithMcpGithub = prependMcpGithubToContext(contextWithProfile, loadMcpGithubEnabled());
      const contextWithOrganizer = prependOrganizerSchedulerToContext(contextWithMcpGithub, loadMcpGithubEnabled());
      const payload = buildChatCompletionPayload(contextWithOrganizer, selectedModel);

      try {
        const response = await openAiProxyChatApi.createChatCompletion(payload, { signal });
        const assistantRawText = extractAssistantText(response);
        const resolvedText = await resolveAssistantCommandText(assistantRawText, signal, true);
        if (resolvedText && resolvedText.trim().length > 0) {
          appendAssistantMessageToCurrentChat(buildSchedulerResultMessage(event.action, resolvedText));
        }
      } catch (error: unknown) {
        const errorText = normalizeError(error);
        appendAssistantMessageToCurrentChat(buildSchedulerErrorMessage(event.action, errorText));
      }

      set((previousState) => {
        const currentEvent = previousState.scheduledEvents.find((item) => item.id === event.id);
        if (!currentEvent) {
          return {};
        }

        const now = Date.now();
        if (currentEvent.repeat.mode === 'always') {
          const nextEvents = previousState.scheduledEvents.map((item) =>
            item.id === currentEvent.id
              ? {
                  ...item,
                  nextRunAt: new Date(now + currentEvent.intervalSeconds * 1000).toISOString(),
                }
              : item,
          );
          saveScheduledEvents(nextEvents);
          return { scheduledEvents: nextEvents };
        }

        if (currentEvent.repeat.remainingRuns <= 1) {
          const nextEvents = previousState.scheduledEvents.filter((item) => item.id !== currentEvent.id);
          saveScheduledEvents(nextEvents);
          return { scheduledEvents: nextEvents };
        }

        const nextRemainingRuns = currentEvent.repeat.remainingRuns - 1;
        const nextEvents = previousState.scheduledEvents.map((item) =>
          item.id === currentEvent.id
            ? {
                ...item,
                repeat: {
                  ...currentEvent.repeat,
                  remainingRuns: nextRemainingRuns,
                },
                nextRunAt: new Date(now + currentEvent.intervalSeconds * 1000).toISOString(),
              }
            : item,
        );
        saveScheduledEvents(nextEvents);
        return { scheduledEvents: nextEvents };
      });
    };

    const runDueScheduledEvents = async () => {
      if (schedulerQueueActive) {
        return;
      }
      schedulerQueueActive = true;
      try {
        // Global queue: execute only one scheduled action at a time.
        while (true) {
          const state = get();
          if (state.status === 'loading') {
            break;
          }

          const now = Date.now();
          const dueEvents = [...state.scheduledEvents]
            .filter((event) => new Date(event.nextRunAt).getTime() <= now)
            .sort((left, right) => new Date(left.nextRunAt).getTime() - new Date(right.nextRunAt).getTime());

          if (dueEvents.length === 0) {
            break;
          }

          await runScheduledEvent(dueEvents[0]);
        }
      } finally {
        schedulerQueueActive = false;
        scheduleSchedulerTimer();
      }
    };

    const cancelActiveRequest = () => {
      if (activeController) {
        activeController.abort();
        activeController = null;
      }
      if (get().activeRequestId !== null) {
        set({
          activeRequestId: null,
          status: 'idle',
        });
      }
    };

    setTimeout(() => {
      scheduleSchedulerTimer();
      void runDueScheduledEvents();
    }, 0);

    return {
      inputValue: '',
      currentChat: initialSessionsState.currentChat,
      chatHistory: initialSessionsState.chatHistory,
      scheduledEvents: initialScheduledEvents,
      schedulerWizard: null,
      statsState: initialStatsState,
      workingMemoryByChat: loadWorkingMemoryByChat(),
      longTermMemory: loadLongTermMemory(),
      status: 'idle',
      errorMessage:
        initialStatsErrorMessage ??
        (initialSessionsStateDiagnostics.hasChatsWithoutStrategy ? 'Чат без стратегии, отобразить нельзя.' : null),
      memoryErrorMessage: null,
      hasChatsWithoutStrategy: initialSessionsStateDiagnostics.hasChatsWithoutStrategy,
      activeRequestId: null,

      setInputValue: (value) => {
        set({ inputValue: value });
      },

      refreshInitialBalance: async () => {
        const currentState = get();
        if (currentState.statsState.previousBalance !== null) {
          return;
        }

        const balance = await openAiProxyChatApi.getBalance();
        set((previousState) => {
          const nextState = {
            ...previousState.statsState,
            previousBalance: balance,
          };
          saveChatStats(nextState);
          return { statsState: nextState };
        });
      },

      sendUserMessage: async () => {
        const snapshot = get();
        const normalizedInput = snapshot.inputValue.trim();
        const selectedModel = resolveChatModel(snapshot.statsState, snapshot.currentChat.id);
        const userMessageCount = countUserMessages(snapshot.currentChat.messages);
        const isLimitReached = userMessageCount >= USER_MESSAGE_LIMIT;
        if (!normalizedInput || snapshot.status === 'loading' || isLimitReached) {
          return;
        }

        const requestId = ++requestSequence;
        activeController?.abort();
        activeController = new AbortController();
        const signal = activeController.signal;
        const isRequestActive = () => get().activeRequestId === requestId;

        const userMessage: ChatMessage = {
          id: getNextMessageId(snapshot.currentChat.messages),
          role: 'user',
          content: normalizedInput,
        };
        const currentWithUserMessage: ChatSession = {
          ...snapshot.currentChat,
          messages: [...snapshot.currentChat.messages, userMessage],
        };
        let nextHistoryState = syncChatToHistory(snapshot.chatHistory, currentWithUserMessage);
        persistSessions(currentWithUserMessage, nextHistoryState);

        if (snapshot.schedulerWizard) {
          const normalized = toLowerTrimmed(normalizedInput);
          if (normalized === 'отмена') {
            const assistantMessage: ChatMessage = {
              id: getNextMessageId(currentWithUserMessage.messages),
              role: 'assistant',
              content: 'Планировщик отменен. Чат снова доступен для обычных сообщений.',
            };
            const updatedCurrentChat: ChatSession = {
              ...currentWithUserMessage,
              messages: [...currentWithUserMessage.messages, assistantMessage],
            };
            nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
            persistSessions(updatedCurrentChat, nextHistoryState);
            set({
              inputValue: '',
              schedulerWizard: null,
              status: 'success',
              errorMessage: null,
              memoryErrorMessage: null,
            });
            return;
          }

          if (snapshot.schedulerWizard.step === 'repeat') {
            let nextRepeat: number | 'always' | null = null;
            if (normalized === 'всегда') {
              nextRepeat = 'always';
            } else if (/^\d+$/.test(normalizedInput)) {
              const parsed = Number(normalizedInput);
              if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 100) {
                nextRepeat = parsed;
              }
            }

            if (nextRepeat === null) {
              const assistantMessage: ChatMessage = {
                id: getNextMessageId(currentWithUserMessage.messages),
                role: 'assistant',
                content: `Некорректное значение. ${getSchedulerRepeatQuestion()}`,
              };
              const updatedCurrentChat: ChatSession = {
                ...currentWithUserMessage,
                messages: [...currentWithUserMessage.messages, assistantMessage],
              };
              nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
              persistSessions(updatedCurrentChat, nextHistoryState);
              set({
                inputValue: '',
                status: 'success',
                errorMessage: null,
                memoryErrorMessage: null,
              });
              return;
            }

            const assistantMessage: ChatMessage = {
              id: getNextMessageId(currentWithUserMessage.messages),
              role: 'assistant',
              content: getSchedulerIntervalQuestion(),
            };
            const updatedCurrentChat: ChatSession = {
              ...currentWithUserMessage,
              messages: [...currentWithUserMessage.messages, assistantMessage],
            };
            nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
            persistSessions(updatedCurrentChat, nextHistoryState);
            set({
              inputValue: '',
              schedulerWizard: {
                step: 'interval',
                repeat: nextRepeat,
                intervalSeconds: null,
              },
              status: 'success',
              errorMessage: null,
              memoryErrorMessage: null,
            });
            return;
          }

          if (snapshot.schedulerWizard.step === 'interval') {
            const parsed = Number(normalizedInput);
            const valid = Number.isInteger(parsed) && parsed >= 10 && parsed <= 86400;
            if (!valid) {
              const assistantMessage: ChatMessage = {
                id: getNextMessageId(currentWithUserMessage.messages),
                role: 'assistant',
                content: `Некорректное значение. ${getSchedulerIntervalQuestion()}`,
              };
              const updatedCurrentChat: ChatSession = {
                ...currentWithUserMessage,
                messages: [...currentWithUserMessage.messages, assistantMessage],
              };
              nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
              persistSessions(updatedCurrentChat, nextHistoryState);
              set({
                inputValue: '',
                status: 'success',
                errorMessage: null,
                memoryErrorMessage: null,
              });
              return;
            }

            const assistantMessage: ChatMessage = {
              id: getNextMessageId(currentWithUserMessage.messages),
              role: 'assistant',
              content: getSchedulerActionQuestion(),
            };
            const updatedCurrentChat: ChatSession = {
              ...currentWithUserMessage,
              messages: [...currentWithUserMessage.messages, assistantMessage],
            };
            nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
            persistSessions(updatedCurrentChat, nextHistoryState);
            set({
              inputValue: '',
              schedulerWizard: {
                step: 'action',
                repeat: snapshot.schedulerWizard.repeat,
                intervalSeconds: parsed,
              },
              status: 'success',
              errorMessage: null,
              memoryErrorMessage: null,
            });
            return;
          }

          const action = normalizedInput.trim();
          if (!action) {
            const assistantMessage: ChatMessage = {
              id: getNextMessageId(currentWithUserMessage.messages),
              role: 'assistant',
              content: `Некорректное значение. ${getSchedulerActionQuestion()}`,
            };
            const updatedCurrentChat: ChatSession = {
              ...currentWithUserMessage,
              messages: [...currentWithUserMessage.messages, assistantMessage],
            };
            nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
            persistSessions(updatedCurrentChat, nextHistoryState);
            set({
              inputValue: '',
              status: 'success',
              errorMessage: null,
              memoryErrorMessage: null,
            });
            return;
          }

          const repeat = snapshot.schedulerWizard.repeat;
          const intervalSeconds = snapshot.schedulerWizard.intervalSeconds;
          if (repeat === null || intervalSeconds === null) {
            set({
              inputValue: '',
              schedulerWizard: null,
              status: 'error',
              errorMessage: 'Планировщик в неконсистентном состоянии. Запустите его снова.',
            });
            return;
          }

          const now = Date.now();
          const event: ScheduledEvent = {
            id: createScheduledEventId(),
            action,
            intervalSeconds,
            repeat: repeat === 'always' ? { mode: 'always' } : { mode: 'count', totalRuns: repeat, remainingRuns: repeat },
            createdAt: new Date(now).toISOString(),
            nextRunAt: new Date(now + intervalSeconds * 1000).toISOString(),
          };
          const nextEvents = [...get().scheduledEvents, event];
          persistScheduledEvents(nextEvents);

          const assistantMessage: ChatMessage = {
            id: getNextMessageId(currentWithUserMessage.messages),
            role: 'assistant',
            content: formatSchedulerCreatedMessage(event),
          };
          const updatedCurrentChat: ChatSession = {
            ...currentWithUserMessage,
            messages: [...currentWithUserMessage.messages, assistantMessage],
          };
          nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
          persistSessions(updatedCurrentChat, nextHistoryState);
          set({
            inputValue: '',
            schedulerWizard: null,
            status: 'success',
            errorMessage: null,
            memoryErrorMessage: null,
          });
          scheduleSchedulerTimer();
          return;
        }

        set({
          inputValue: '',
          status: 'loading',
          errorMessage: null,
          memoryErrorMessage: null,
          activeRequestId: requestId,
        });

        try {
          const currentBalanceState = get().statsState.previousBalance;
          const balanceBefore = await (currentBalanceState === null ? openAiProxyChatApi.getBalance({ signal }) : Promise.resolve(currentBalanceState));
          if (!isRequestActive()) {
            return;
          }

          let accumulatedUsage = createEmptyUsage();
          let chatForRequest = currentWithUserMessage;

          if (isTaskEnabled(chatForRequest.taskId) && chatForRequest.taskState) {
            const taskTurn = await runFrontendPromptTaskTurn({
              chatId: chatForRequest.id,
              taskState: chatForRequest.taskState,
              userInput: userMessage.content,
              llmCall: async (taskMessages) => {
                const payload = buildChatCompletionPayload(taskMessages, selectedModel);
                const response = await openAiProxyChatApi.createChatCompletion(payload, { signal });
                return {
                  text: extractAssistantText(response),
                  usage: extractUsageSafe(response),
                };
              },
            });
            if (!isRequestActive()) {
              return;
            }

            accumulatedUsage = addUsage(accumulatedUsage, taskTurn.usage);
            const assistantMessage: ChatMessage = {
              id: getNextMessageId(chatForRequest.messages),
              role: 'assistant',
              content: taskTurn.assistantText,
            };
            const updatedCurrentChat: ChatSession = {
              ...chatForRequest,
              taskState: taskTurn.taskState,
              messages: [...chatForRequest.messages, assistantMessage],
            };
            nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
            persistSessions(updatedCurrentChat, nextHistoryState);

            const balanceAfter = await openAiProxyChatApi.getBalance({ signal });
            if (!isRequestActive()) {
              return;
            }
            const requestCost = resolveRequestCost(balanceBefore, balanceAfter);

            set((previousState) => {
              const stats = getChatStats(previousState.statsState, updatedCurrentChat.id);
              const nextStatsState: ChatStatsState = {
                ...previousState.statsState,
                previousBalance: balanceAfter,
                byChat: {
                  ...previousState.statsState.byChat,
                  [updatedCurrentChat.id]: {
                    ...stats,
                    model: selectedModel,
                    totalCost: stats.totalCost + requestCost,
                    promptTokens: stats.promptTokens + accumulatedUsage.prompt_tokens,
                    completionTokens: stats.completionTokens + accumulatedUsage.completion_tokens,
                    totalTokens: stats.totalTokens + accumulatedUsage.total_tokens,
                  },
                },
              };
              saveChatStats(nextStatsState);
              return {
                statsState: nextStatsState,
                status: 'success',
                activeRequestId: null,
              };
            });
            activeController = null;
            return;
          }

          if (currentWithUserMessage.contextStrategy === 'strategy-2') {
            const factPayload = buildChatCompletionPayload(
              [
                { role: 'system', content: FACT_EXTRACTOR_SYSTEM_PROMPT },
                {
                  role: 'user',
                  content: `Извлеки факты из сообщения пользователя в формате JSON key-value.\n\nСообщение пользователя:\n${userMessage.content}`,
                },
              ],
              selectedModel,
            );
            const factResponse = await openAiProxyChatApi.createChatCompletion(factPayload, { signal });
            if (!isRequestActive()) {
              return;
            }
            const extractedFacts = parseFactsJson(extractAssistantText(factResponse));
            accumulatedUsage = addUsage(accumulatedUsage, extractUsageSafe(factResponse));
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

          let nextWorkingMemory = get().workingMemoryByChat[chatForRequest.id] ?? null;
          try {
            const workingMemoryPayload = buildChatCompletionPayload(
              buildWorkingMemoryExtractionMessages(chatForRequest.messages, nextWorkingMemory),
              selectedModel,
            );
            const workingMemoryResponse = await openAiProxyChatApi.createChatCompletion(workingMemoryPayload, { signal });
            if (!isRequestActive()) {
              return;
            }
            const parsedWorkingMemory = parseWorkingMemory(extractAssistantText(workingMemoryResponse));
            const workingMemoryByChatNext = {
              ...get().workingMemoryByChat,
              [chatForRequest.id]: parsedWorkingMemory,
            };
            nextWorkingMemory = parsedWorkingMemory;
            persistWorkingMemoryByChat(workingMemoryByChatNext);
            accumulatedUsage = addUsage(accumulatedUsage, extractUsageSafe(workingMemoryResponse));
          } catch (error: unknown) {
            if (!isAbortError(error)) {
              const normalized = normalizeError(error);
              console.error('[memory] working memory extraction failed', error);
              set({ memoryErrorMessage: `Рабочая память: ${normalized}` });
            }
          }

          let nextLongTermMemory = get().longTermMemory;
          try {
            const longTermPayload = buildChatCompletionPayload(
              buildLongTermMemoryExtractionMessages(chatForRequest.messages, nextLongTermMemory),
              selectedModel,
            );
            const longTermResponse = await openAiProxyChatApi.createChatCompletion(longTermPayload, { signal });
            if (!isRequestActive()) {
              return;
            }
            const parsedLongTermMemory = parseLongTermMemory(extractAssistantText(longTermResponse));
            nextLongTermMemory = parsedLongTermMemory;
            persistLongTermMemory(parsedLongTermMemory);
            accumulatedUsage = addUsage(accumulatedUsage, extractUsageSafe(longTermResponse));
          } catch (error: unknown) {
            if (!isAbortError(error)) {
              const normalized = normalizeError(error);
              console.error('[memory] long-term memory extraction failed', error);
              set((previousState) => ({
                memoryErrorMessage: previousState.memoryErrorMessage
                  ? `${previousState.memoryErrorMessage}\nДолговременная память: ${normalized}`
                  : `Долговременная память: ${normalized}`,
              }));
            }
          }

          const contextMessages = buildContextByStrategy(
            chatForRequest.contextStrategy,
            chatForRequest.messages,
            chatForRequest.strategySettings,
          );
          const contextWithMemory = prependMemoryToContext(contextMessages, nextWorkingMemory, nextLongTermMemory);
          const contextWithProfile = prependUserProfileToContext(contextWithMemory, chatForRequest.profileId);
          const contextWithMcpGithub = prependMcpGithubToContext(contextWithProfile, loadMcpGithubEnabled());
          const contextWithOrganizer = prependOrganizerSchedulerToContext(contextWithMcpGithub, loadMcpGithubEnabled());
          const payload = buildChatCompletionPayload(contextWithOrganizer, selectedModel);
          const response = await openAiProxyChatApi.createChatCompletion(payload, { signal });
          if (!isRequestActive()) {
            return;
          }
          accumulatedUsage = addUsage(accumulatedUsage, extractUsage(response));
          const assistantText = await resolveAssistantCommandText(extractAssistantText(response), signal, true);
          const balanceAfter = await openAiProxyChatApi.getBalance({ signal });
          if (!isRequestActive()) {
            return;
          }
          const requestCost = resolveRequestCost(balanceBefore, balanceAfter);

          const assistantMessage: ChatMessage = {
            id: getNextMessageId(chatForRequest.messages),
            role: 'assistant',
            content: assistantText ?? '',
          };
          const updatedCurrentChat: ChatSession = {
            ...chatForRequest,
            messages: [...chatForRequest.messages, assistantMessage],
          };
          nextHistoryState = syncChatToHistory(nextHistoryState, updatedCurrentChat);
          persistSessions(updatedCurrentChat, nextHistoryState);

          set((previousState) => {
            const stats = getChatStats(previousState.statsState, updatedCurrentChat.id);
            const nextStatsState: ChatStatsState = {
              ...previousState.statsState,
              previousBalance: balanceAfter,
              byChat: {
                ...previousState.statsState.byChat,
                [updatedCurrentChat.id]: {
                  ...stats,
                  model: payload.model,
                  totalCost: stats.totalCost + requestCost,
                  promptTokens: stats.promptTokens + accumulatedUsage.prompt_tokens,
                  completionTokens: stats.completionTokens + accumulatedUsage.completion_tokens,
                  totalTokens: stats.totalTokens + accumulatedUsage.total_tokens,
                },
              },
            };
            saveChatStats(nextStatsState);
            return {
              statsState: nextStatsState,
              status: 'success',
              activeRequestId: null,
            };
          });
          activeController = null;
        } catch (error: unknown) {
          if (!isRequestActive()) {
            return;
          }
          if (isAbortError(error)) {
            set({
              status: 'idle',
              activeRequestId: null,
            });
            return;
          }
          if (!isServerHttpError(error)) {
            console.warn('[chat-agent] non-http error hidden from UI', error);
            set({
              status: 'idle',
              activeRequestId: null,
              errorMessage: null,
            });
            return;
          }
          set({
            status: 'error',
            activeRequestId: null,
            errorMessage: normalizeError(error),
          });
        } finally {
          if (get().activeRequestId === null) {
            activeController = null;
            void runDueScheduledEvents();
          }
        }
      },

      createNewChat: (contextStrategy = 'strategy-1', options) => {
        cancelActiveRequest();
        const currentState = get();
        const nextHistory = options?.discardCurrentChat
          ? removeChatById(currentState.chatHistory, currentState.currentChat.id)
          : isChatEmpty(currentState.currentChat)
            ? currentState.chatHistory
            : syncChatToHistory(currentState.chatHistory, currentState.currentChat);
        const nextCurrentChat = createEmptyChatSession(contextStrategy);
        persistSessions(nextCurrentChat, nextHistory);

        if (options?.discardCurrentChat) {
          set((previousState) => {
            const nextStatsState = removeChatStats(previousState.statsState, previousState.currentChat.id);
            const nextMemoryMap = deleteWorkingMemoryForChat(previousState.workingMemoryByChat, previousState.currentChat.id);
            saveChatStats(nextStatsState);
            saveWorkingMemoryByChat(nextMemoryMap);
            return {
              statsState: nextStatsState,
              workingMemoryByChat: nextMemoryMap,
            };
          });
        }
        set({
          inputValue: '',
          status: 'idle',
          errorMessage: null,
          memoryErrorMessage: null,
        });
      },

      createBranchFromCurrentChat: () => {
        cancelActiveRequest();
        const currentState = get();
        if (currentState.currentChat.contextStrategy !== 'strategy-3' || isChatEmpty(currentState.currentChat)) {
          return false;
        }

        const nextHistoryWithCurrent = syncChatToHistory(currentState.chatHistory, currentState.currentChat);
        const nextCurrentChat = createBranchedChatSession(currentState.currentChat, [currentState.currentChat, ...nextHistoryWithCurrent]);
        const nextHistory = syncChatToHistory(nextHistoryWithCurrent, nextCurrentChat);
        persistSessions(nextCurrentChat, nextHistory);
        set({
          inputValue: '',
          status: 'idle',
          errorMessage: null,
          memoryErrorMessage: null,
        });
        return true;
      },

      setCurrentChatStrategy: (contextStrategy) => {
        const currentState = get();
        if (!isChatEmpty(currentState.currentChat) || currentState.currentChat.contextStrategy === contextStrategy) {
          return false;
        }
        cancelActiveRequest();
        const nextCurrentChat: ChatSession = {
          ...currentState.currentChat,
          contextStrategy,
        };
        persistSessions(nextCurrentChat, currentState.chatHistory);
        return true;
      },

      setCurrentChatProfile: (profileId) => {
        const currentState = get();
        if (!isChatEmpty(currentState.currentChat) || currentState.currentChat.profileId === profileId) {
          return false;
        }
        cancelActiveRequest();
        const nextCurrentChat: ChatSession = {
          ...currentState.currentChat,
          profileId,
        };
        persistSessions(nextCurrentChat, currentState.chatHistory);
        return true;
      },

      setCurrentChatModel: (model) => {
        const currentState = get();
        if (currentState.status === 'loading') {
          return false;
        }
        if (resolveChatModel(currentState.statsState, currentState.currentChat.id) === model) {
          return true;
        }

        const currentChatStats = getChatStats(currentState.statsState, currentState.currentChat.id);
        const nextStatsState: ChatStatsState = {
          ...currentState.statsState,
          byChat: {
            ...currentState.statsState.byChat,
            [currentState.currentChat.id]: {
              ...currentChatStats,
              model,
            },
          },
        };
        saveChatStats(nextStatsState);
        set({ statsState: nextStatsState });
        return true;
      },

      setCurrentChatTask: (taskId) => {
        const currentState = get();
        if (!isChatEmpty(currentState.currentChat) || currentState.currentChat.taskId === taskId) {
          return false;
        }
        cancelActiveRequest();
        const nextCurrentChat: ChatSession = {
          ...currentState.currentChat,
          taskId,
          taskState: isTaskEnabled(taskId) ? createFrontendPromptInitialTaskState() : null,
        };
        persistSessions(nextCurrentChat, currentState.chatHistory);
        return true;
      },

      setCurrentTaskInvariantsEnabled: (enabled) => {
        const currentState = get();
        if (!isChatEmpty(currentState.currentChat) || currentState.currentChat.taskId === 'none' || !currentState.currentChat.taskState) {
          return false;
        }
        if (currentState.currentChat.taskState.invariantsEnabled === enabled) {
          return true;
        }
        cancelActiveRequest();
        const nextCurrentChat: ChatSession = {
          ...currentState.currentChat,
          taskState: {
            ...currentState.currentChat.taskState,
            invariantsEnabled: enabled,
            invariantViolation: null,
            updatedAt: new Date().toISOString(),
            version: currentState.currentChat.taskState.version + 1,
          },
        };
        persistSessions(nextCurrentChat, currentState.chatHistory);
        return true;
      },

      setStrategy1WindowSize: (windowSize) => {
        const currentState = get();
        if (!isChatEmpty(currentState.currentChat) || !Number.isInteger(windowSize) || windowSize <= 0) {
          return false;
        }
        if (currentState.currentChat.strategySettings.strategy1WindowSize === windowSize) {
          return true;
        }
        cancelActiveRequest();
        const nextCurrentChat: ChatSession = {
          ...currentState.currentChat,
          strategySettings: {
            ...currentState.currentChat.strategySettings,
            strategy1WindowSize: windowSize,
          },
        };
        const nextHistory = currentState.chatHistory.map((chat) =>
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

      setStrategy2WindowSize: (windowSize) => {
        const currentState = get();
        if (!isChatEmpty(currentState.currentChat) || !Number.isInteger(windowSize) || windowSize < 0) {
          return false;
        }
        if (currentState.currentChat.strategySettings.strategy2WindowSize === windowSize) {
          return true;
        }
        cancelActiveRequest();
        const nextCurrentChat: ChatSession = {
          ...currentState.currentChat,
          strategySettings: {
            ...currentState.currentChat.strategySettings,
            strategy2WindowSize: windowSize,
          },
        };
        const nextHistory = currentState.chatHistory.map((chat) =>
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

      switchToHistoryChat: (chatId) => {
        cancelActiveRequest();
        const currentState = get();
        const selectedChat = currentState.chatHistory.find((chat) => chat.id === chatId);
        if (!selectedChat) {
          return;
        }

        const nextHistory = isChatEmpty(currentState.currentChat)
          ? currentState.chatHistory
          : syncChatToHistory(currentState.chatHistory, currentState.currentChat);
        persistSessions(selectedChat, nextHistory);
        set({
          inputValue: '',
          status: 'idle',
          errorMessage: null,
          memoryErrorMessage: null,
        });
      },

      deleteHistoryChat: (chatId) => {
        cancelActiveRequest();
        const currentState = get();
        const nextHistory = removeChatById(currentState.chatHistory, chatId);
        if (nextHistory.length === currentState.chatHistory.length) {
          return;
        }

        if (chatId === currentState.currentChat.id) {
          persistSessions(createEmptyChatSession(), nextHistory);
          set((previousState) => {
            const nextStatsState = removeChatStats(previousState.statsState, chatId);
            const nextMemoryMap = deleteWorkingMemoryForChat(previousState.workingMemoryByChat, chatId);
            saveChatStats(nextStatsState);
            saveWorkingMemoryByChat(nextMemoryMap);
            return {
              statsState: nextStatsState,
              workingMemoryByChat: nextMemoryMap,
              inputValue: '',
              status: 'idle',
              errorMessage: null,
              memoryErrorMessage: null,
            };
          });
          return;
        }

        persistSessions(currentState.currentChat, nextHistory);
        set((previousState) => {
          const nextStatsState = removeChatStats(previousState.statsState, chatId);
          const nextMemoryMap = deleteWorkingMemoryForChat(previousState.workingMemoryByChat, chatId);
          saveChatStats(nextStatsState);
          saveWorkingMemoryByChat(nextMemoryMap);
          return {
            statsState: nextStatsState,
            workingMemoryByChat: nextMemoryMap,
          };
        });
      },

      deleteScheduledEvent: (eventId) => {
        const currentState = get();
        const nextEvents = currentState.scheduledEvents.filter((event) => event.id !== eventId);
        if (nextEvents.length === currentState.scheduledEvents.length) {
          return;
        }
        persistScheduledEvents(nextEvents);
        scheduleSchedulerTimer();
      },

      clearChat: () => {
        cancelActiveRequest();
        const currentState = get();
        const nextCurrentChat = createEmptyChatSession();
        const nextHistory = removeChatById(currentState.chatHistory, currentState.currentChat.id);
        persistSessions(nextCurrentChat, nextHistory);

        set((previousState) => {
          const nextStatsState = removeChatStats(previousState.statsState, previousState.currentChat.id);
          const nextMemoryMap = deleteWorkingMemoryForChat(previousState.workingMemoryByChat, previousState.currentChat.id);
          saveChatStats(nextStatsState);
          saveWorkingMemoryByChat(nextMemoryMap);
          return {
            statsState: nextStatsState,
            workingMemoryByChat: nextMemoryMap,
            inputValue: '',
            status: 'idle',
            errorMessage: null,
            memoryErrorMessage: null,
          };
        });

        void get()
          .refreshInitialBalance()
          .catch(() => {
            console.warn('[chat-agent] initial balance refresh failed after clearChat');
          });
      },

      clearLongTermMemory: () => {
        const resetItems = resetLongTermMemory();
        set({
          longTermMemory: resetItems,
          memoryErrorMessage: null,
        });
      },
    };
  });

  return store;
}

let chatAgentStoreInstance: StoreApi<ChatAgentStoreState> | null = null;

export function getChatAgentStore(): StoreApi<ChatAgentStoreState> {
  if (chatAgentStoreInstance) {
    return chatAgentStoreInstance;
  }

  chatAgentStoreInstance = createChatAgentStore();
  return chatAgentStoreInstance;
}

export function getChatAgentDerived(state: ChatAgentStoreState) {
  const messages = state.currentChat.messages;
  const userMessageCount = countUserMessages(messages);
  const isLimitReached = userMessageCount >= USER_MESSAGE_LIMIT;
  const currentWorkingMemory = state.workingMemoryByChat[state.currentChat.id] ?? null;
  const currentChatStats = getChatStats(state.statsState, state.currentChat.id);

  return {
    canCreateBranchFromCurrentChat:
      state.status !== 'loading' && state.currentChat.contextStrategy === 'strategy-3' && !isChatEmpty(state.currentChat),
    currentChatStrategy: state.currentChat.contextStrategy,
    currentChatProfile: state.currentChat.profileId,
    currentChatTask: state.currentChat.taskId,
    currentTaskInvariantsEnabled: state.currentChat.taskState?.invariantsEnabled ?? false,
    currentStrategy1WindowSize: state.currentChat.strategySettings.strategy1WindowSize,
    currentStrategy2WindowSize: state.currentChat.strategySettings.strategy2WindowSize,
    currentChatId: state.currentChat.id,
    scheduledEvents: state.scheduledEvents,
    messages,
    model: resolveChatModel(state.statsState, state.currentChat.id),
    promptTokens: currentChatStats.promptTokens,
    completionTokens: currentChatStats.completionTokens,
    totalTokens: currentChatStats.totalTokens,
    totalCost: currentChatStats.totalCost,
    workingMemory: currentWorkingMemory,
    userMessageCount,
    isLimitReached,
    limitNotice: isLimitReached ? LIMIT_REACHED_TEXT : null,
  };
}

export type ChatAgentView = ReturnType<typeof getChatAgentDerived>;
