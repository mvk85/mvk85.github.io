export const CHAT_MODEL_OPTIONS = ['gpt-5.1', 'gpt-5.2', 'gpt-5.4', 'gpt-5-mini', 'gpt-5-nano'] as const;

export type ChatModel = (typeof CHAT_MODEL_OPTIONS)[number];
