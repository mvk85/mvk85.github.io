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
