export type ChatMessageRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
};

export type ChatCompletionPayload = {
  model: 'gpt-4o';
  messages: ChatMessage[];
};

