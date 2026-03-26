export const CHAT_MODEL_OPTIONS = [
  'gpt-5.1',
  'gpt-5.2',
  'gpt-5.4',
  'gpt-5-mini',
  'gpt-5-nano',
  'qwen2.5:0.5b',
  'qwen2.5:1.5b',
  'qwen2.5:3b',
  'qwen2.5:7b',
] as const;

export type ChatModel = (typeof CHAT_MODEL_OPTIONS)[number];
