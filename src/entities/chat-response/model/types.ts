export type ChatCompletionResponse = {
  id: string;
  created: number;
  model: string;
  object: string;
  choices: Array<{
    finish_reason: string | null;
    index: number;
    message: {
      role: 'assistant' | 'user' | 'system';
      content: string | null;
    };
  }>;
};
