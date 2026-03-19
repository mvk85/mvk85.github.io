import { CHAT_SESSIONS_STORAGE_KEY } from '@/entities/chat/lib/constants';
import { loadChatMessages } from '@/entities/chat/lib/storage';
import { createEmptySummaryState, loadChatSummaryState } from '@/entities/chat/lib/summaryStorage';
import {
  createFrontendPromptInitialTaskState,
  FRONTEND_PROMPT_TASK_QUESTIONS,
  isTaskEnabled,
  isValidChatTaskId,
} from '@/entities/chat/lib/taskConfig';
import type {
  ChatContextStrategy,
  ChatMessage,
  ChatMessageRagModeComparison,
  ChatSession,
  ChatSessionsState,
  ChatSummaryState,
  ChatStrategySettings,
  ChatTaskId,
  ChatTaskState,
  FrontendPromptTaskState,
} from '@/entities/chat/model/types';
import { DEFAULT_USER_PROFILE_ID, isValidUserProfileId } from '@/entities/profile/lib/profileConfig';
import type { UserProfileId } from '@/entities/profile/model/types';

const DEFAULT_STRATEGY_1_WINDOW_SIZE = 10;
const DEFAULT_STRATEGY_2_WINDOW_SIZE = 10;

type StoredChatSession = {
  id?: unknown;
  createdAt?: unknown;
  parentChatId?: unknown;
  ragClarificationAttempts?: unknown;
  profileId?: unknown;
  taskId?: unknown;
  taskState?: unknown;
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

type NormalizeChatSessionResult = {
  chat: ChatSession | null;
  hasMissingStrategy: boolean;
};

export type ChatSessionsStateDiagnostics = {
  state: ChatSessionsState;
  hasChatsWithoutStrategy: boolean;
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
  let rag: ChatMessage['rag'];
  if (typeof candidate.rag === 'object' && candidate.rag !== null && !Array.isArray(candidate.rag)) {
    const ragCandidate = candidate.rag as { used?: unknown; sources?: unknown; modeComparison?: unknown };
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

      let modeComparison: ChatMessageRagModeComparison | undefined;
      if (typeof ragCandidate.modeComparison === 'object' && ragCandidate.modeComparison !== null && !Array.isArray(ragCandidate.modeComparison)) {
        const raw = ragCandidate.modeComparison as Record<string, unknown>;
        const normalizeItems = (value: unknown) => {
          if (!Array.isArray(value)) {
            return [];
          }
          return value
            .map((item) => {
              if (typeof item !== 'object' || item === null || Array.isArray(item)) {
                return null;
              }
              const candidateItem = item as { indexId?: unknown; chunkId?: unknown; score?: unknown };
              if (typeof candidateItem.indexId !== 'string' || typeof candidateItem.chunkId !== 'string' || typeof candidateItem.score !== 'number') {
                return null;
              }
              return {
                indexId: candidateItem.indexId,
                chunkId: candidateItem.chunkId,
                score: candidateItem.score,
              };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item));
        };
        modeComparison = {
          baseline: normalizeItems(raw.baseline),
          threshold: normalizeItems(raw.threshold),
          heuristic: normalizeItems(raw.heuristic),
        };
      }

      rag = {
        used: ragCandidate.used,
        sources: normalizedSources,
        ...(modeComparison ? { modeComparison } : {}),
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

function isValidTaskStage(value: unknown): value is FrontendPromptTaskState['stage'] {
  return value === 'planning' || value === 'execution' || value === 'validation' || value === 'done';
}

function normalizeTaskState(value: unknown, taskId: Exclude<ChatTaskId, 'none'>): ChatTaskState {
  if (taskId !== 'frontend_app_prompt') {
    return createFrontendPromptInitialTaskState();
  }

  if (typeof value !== 'object' || value === null) {
    return createFrontendPromptInitialTaskState();
  }

  const candidate = value as Partial<FrontendPromptTaskState>;
  if (candidate.taskId !== 'frontend_app_prompt' || !isValidTaskStage(candidate.stage) || !Array.isArray(candidate.planningQuestions)) {
    return createFrontendPromptInitialTaskState();
  }

  const planningQuestions = candidate.planningQuestions
    .map((question) => {
      if (typeof question !== 'object' || question === null) {
        return null;
      }
      const normalized = question as Partial<{ id: unknown; text: unknown }>;
      if (typeof normalized.id !== 'string' || normalized.id.trim().length === 0 || typeof normalized.text !== 'string' || normalized.text.trim().length === 0) {
        return null;
      }
      return {
        id: normalized.id,
        text: normalized.text,
      };
    })
    .filter((question): question is { id: string; text: string } => Boolean(question));

  const planningAnswersSource =
    typeof candidate.planningAnswers === 'object' && candidate.planningAnswers !== null && !Array.isArray(candidate.planningAnswers)
      ? candidate.planningAnswers
      : {};
  const planningAnswers = Object.entries(planningAnswersSource as Record<string, unknown>).reduce<Record<string, string>>((accumulator, [key, rawValue]) => {
    if (typeof rawValue !== 'string' || key.trim().length === 0 || rawValue.trim().length === 0) {
      return accumulator;
    }
    accumulator[key] = rawValue.trim();
    return accumulator;
  }, {});

  const validationResult =
    typeof candidate.validationResult === 'object' && candidate.validationResult !== null && !Array.isArray(candidate.validationResult)
      ? candidate.validationResult
      : null;
  let normalizedValidationResult: FrontendPromptTaskState['validationResult'] = null;
  if (validationResult) {
    const validationCandidate = validationResult as Record<string, unknown>;
    const status =
      validationCandidate.status === 'approved' || validationCandidate.status === 'needs_revision' ? validationCandidate.status : null;
    const reviewSummary = typeof validationCandidate.reviewSummary === 'string' ? validationCandidate.reviewSummary.trim() : '';

    if (status && reviewSummary.length > 0) {
      normalizedValidationResult = {
        status,
        reviewSummary,
        issues: Array.isArray(validationCandidate.issues)
          ? validationCandidate.issues.filter((issue): issue is string => typeof issue === 'string' && issue.trim().length > 0)
          : [],
        clarificationQuestions: Array.isArray(validationCandidate.clarificationQuestions)
          ? validationCandidate.clarificationQuestions.filter(
              (question): question is string => typeof question === 'string' && question.trim().length > 0,
            )
          : [],
        reviewedAt: typeof validationCandidate.reviewedAt === 'string' ? validationCandidate.reviewedAt : new Date().toISOString(),
      };
    }
  }

  const invariantViolation =
    typeof candidate.invariantViolation === 'object' && candidate.invariantViolation !== null && !Array.isArray(candidate.invariantViolation)
      ? candidate.invariantViolation
      : null;
  const normalizedInvariantViolation =
    invariantViolation &&
    typeof invariantViolation.invariantId === 'string' &&
    typeof invariantViolation.questionId === 'string' &&
    typeof invariantViolation.questionText === 'string' &&
    typeof invariantViolation.ruleText === 'string'
      ? {
          invariantId: invariantViolation.invariantId,
          questionId: invariantViolation.questionId,
          questionText: invariantViolation.questionText,
          ruleText: invariantViolation.ruleText,
        }
      : null;

  return {
    taskId: 'frontend_app_prompt',
    stage: candidate.stage,
    currentStep: typeof candidate.currentStep === 'string' ? candidate.currentStep : 'Сбор вводных по новому фронтенд приложению.',
    expectedAction:
      typeof candidate.expectedAction === 'string'
        ? candidate.expectedAction
        : 'Ответьте на все вопросы planning (можно частями в нескольких сообщениях).',
    planningQuestions:
      planningQuestions.length === FRONTEND_PROMPT_TASK_QUESTIONS.length &&
      planningQuestions.every((question, index) => question.id === FRONTEND_PROMPT_TASK_QUESTIONS[index]?.id)
        ? FRONTEND_PROMPT_TASK_QUESTIONS.map((question) => ({ ...question }))
        : createFrontendPromptInitialTaskState().planningQuestions,
    planningAnswers,
    invariantsEnabled: typeof candidate.invariantsEnabled === 'boolean' ? candidate.invariantsEnabled : false,
    lastGeneratedPrompt: typeof candidate.lastGeneratedPrompt === 'string' ? candidate.lastGeneratedPrompt : null,
    invariantViolation: normalizedInvariantViolation,
    validationResult: normalizedValidationResult,
    revisionRequest: typeof candidate.revisionRequest === 'string' ? candidate.revisionRequest : null,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
    version: typeof candidate.version === 'number' && Number.isInteger(candidate.version) && candidate.version > 0 ? candidate.version : 1,
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
  ragClarificationAttempts?: number;
  profileId?: UserProfileId;
  taskId?: ChatTaskId;
  taskState?: ChatTaskState | null;
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
    ragClarificationAttempts:
      typeof params?.ragClarificationAttempts === 'number' &&
      Number.isInteger(params.ragClarificationAttempts) &&
      params.ragClarificationAttempts >= 0
        ? params.ragClarificationAttempts
        : 0,
    profileId: params?.profileId ?? DEFAULT_USER_PROFILE_ID,
    taskId: params?.taskId ?? 'none',
    taskState:
      params?.taskId && isTaskEnabled(params.taskId)
        ? params?.taskState ?? createFrontendPromptInitialTaskState()
        : null,
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

function normalizeChatSession(value: unknown): NormalizeChatSessionResult {
  if (typeof value !== 'object' || value === null) {
    return {
      chat: null,
      hasMissingStrategy: false,
    };
  }

  const candidate = value as StoredChatSession;
  if (typeof candidate.id !== 'string' || typeof candidate.createdAt !== 'string') {
    return {
      chat: null,
      hasMissingStrategy: false,
    };
  }

  if (!Array.isArray(candidate.messages)) {
    return {
      chat: null,
      hasMissingStrategy: false,
    };
  }

  if (!isValidContextStrategy(candidate.contextStrategy)) {
    return {
      chat: null,
      hasMissingStrategy: true,
    };
  }

  const normalizedMessages: ChatMessage[] = [];
  for (let index = 0; index < candidate.messages.length; index += 1) {
    const message = normalizeChatMessage(candidate.messages[index], index + 1);
    if (message) {
      normalizedMessages.push(message);
    }
  }

  const taskId = isValidChatTaskId(candidate.taskId) ? candidate.taskId : 'none';
  const taskState = isTaskEnabled(taskId) ? normalizeTaskState(candidate.taskState, taskId) : null;

  return {
    chat: {
      id: candidate.id,
      createdAt: candidate.createdAt,
      parentChatId: typeof candidate.parentChatId === 'string' ? candidate.parentChatId : null,
      ragClarificationAttempts:
        typeof candidate.ragClarificationAttempts === 'number' &&
        Number.isInteger(candidate.ragClarificationAttempts) &&
        candidate.ragClarificationAttempts >= 0
          ? candidate.ragClarificationAttempts
          : 0,
      profileId: isValidUserProfileId(candidate.profileId) ? candidate.profileId : DEFAULT_USER_PROFILE_ID,
      taskId,
      taskState,
      title: typeof candidate.title === 'string' ? candidate.title : normalizeChatTitle(normalizedMessages),
      messages: normalizedMessages,
      summaryState: normalizeSummaryState(candidate.summaryState),
      contextStrategy: candidate.contextStrategy,
      strategySettings: normalizeStrategySettings(candidate.strategySettings),
    },
    hasMissingStrategy: false,
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
  const branchMessages = parentChat.messages.map((message) => ({
    ...message,
    ...(message.rag
      ? {
          rag: {
            used: message.rag.used,
            sources: message.rag.sources.map((source) => ({ ...source })),
            ...(message.rag.modeComparison
              ? {
                  modeComparison: {
                    baseline: message.rag.modeComparison.baseline.map((item) => ({ ...item })),
                    threshold: message.rag.modeComparison.threshold.map((item) => ({ ...item })),
                    heuristic: message.rag.modeComparison.heuristic.map((item) => ({ ...item })),
                  },
                }
              : {}),
          },
        }
      : {}),
  }));
  const baseTitle = getBaseChatTitle(parentChat);
  const branchNumber = getNextBranchNumber(baseTitle, parentChat.id, allChats);

  return createChatSession({
    parentChatId: parentChat.id,
    title: `${baseTitle}_ветка_${branchNumber}`,
    profileId: parentChat.profileId,
    taskId: parentChat.taskId,
    taskState: parentChat.taskState
      ? {
          ...parentChat.taskState,
          planningQuestions: parentChat.taskState.planningQuestions.map((question) => ({ ...question })),
          planningAnswers: { ...parentChat.taskState.planningAnswers },
          invariantsEnabled: parentChat.taskState.invariantsEnabled,
          invariantViolation: parentChat.taskState.invariantViolation ? { ...parentChat.taskState.invariantViolation } : null,
          validationResult: parentChat.taskState.validationResult
            ? {
                ...parentChat.taskState.validationResult,
                issues: [...parentChat.taskState.validationResult.issues],
                clarificationQuestions: [...parentChat.taskState.validationResult.clarificationQuestions],
              }
            : null,
        }
      : null,
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
  return loadChatSessionsStateWithDiagnostics().state;
}

export function loadChatSessionsStateWithDiagnostics(): { state: ChatSessionsState | null; hasChatsWithoutStrategy: boolean } {
  const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
  if (!raw) {
    return {
      state: null,
      hasChatsWithoutStrategy: false,
    };
  }

  try {
    const parsed = JSON.parse(raw) as StoredChatSessionsState;
    if (!Array.isArray(parsed.chatHistory)) {
      return {
        state: null,
        hasChatsWithoutStrategy: false,
      };
    }

    const currentChatResult = normalizeChatSession(parsed.currentChat);
    let hasChatsWithoutStrategy = currentChatResult.hasMissingStrategy;
    const chatHistory: ChatSession[] = [];
    for (const item of parsed.chatHistory) {
      const normalizedChat = normalizeChatSession(item);
      hasChatsWithoutStrategy = hasChatsWithoutStrategy || normalizedChat.hasMissingStrategy;
      if (normalizedChat.chat) {
        chatHistory.push(normalizedChat.chat);
      }
    }

    return {
      state: {
        currentChat: currentChatResult.chat ?? createEmptyChatSession(),
        chatHistory,
      },
      hasChatsWithoutStrategy,
    };
  } catch {
    return {
      state: null,
      hasChatsWithoutStrategy: false,
    };
  }
}

export function initializeChatSessionsState(): ChatSessionsState {
  return initializeChatSessionsStateWithDiagnostics().state;
}

export function initializeChatSessionsStateWithDiagnostics(): ChatSessionsStateDiagnostics {
  const storedState = loadChatSessionsStateWithDiagnostics();
  if (storedState.state) {
    return {
      state: storedState.state,
      hasChatsWithoutStrategy: storedState.hasChatsWithoutStrategy,
    };
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
  return {
    state: initialState,
    hasChatsWithoutStrategy: false,
  };
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
