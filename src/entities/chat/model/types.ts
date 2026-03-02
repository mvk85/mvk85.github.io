export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessage = {
  id: number;
  role: ChatMessageRole;
  content: string;
};

export type LlmMessageRole = 'system' | 'user' | 'assistant';

export type LlmMessage = {
  role: LlmMessageRole;
  content: string;
};

export type ChatCompletionPayload = {
  model: string;
  messages: LlmMessage[];
};

export type ChatSummaryState = {
  summaryText: string;
  coveredUntilMessageId: number | null;
  updatedAt: string | null;
};

export type ChatContextStrategy = 'strategy-1' | 'strategy-2' | 'strategy-3';

export type Strategy2Facts = Record<string, string>;

export type ChatStrategySettings = {
  strategy1WindowSize: number;
  strategy2WindowSize: number;
  strategy2Facts: Strategy2Facts;
};

export type ChatSession = {
  id: string;
  createdAt: string;
  parentChatId: string | null;
  messages: ChatMessage[];
  summaryState: ChatSummaryState;
  contextStrategy: ChatContextStrategy;
  strategySettings: ChatStrategySettings;
  title?: string;
};

export type ChatSessionsState = {
  currentChat: ChatSession;
  chatHistory: ChatSession[];
};
