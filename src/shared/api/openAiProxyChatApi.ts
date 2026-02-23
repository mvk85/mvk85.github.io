import type { ChatCompletionResponse } from '@/entities/chat-response/model/types';
import { postJson } from '@/shared/api/client';
import { env } from '@/shared/config/env';

export const openAiProxyChatApi = {
  createChatCompletion: async (body: unknown): Promise<ChatCompletionResponse> => {
    if (!env.openAiApiUrl) {
      throw new Error('Не задан VITE_OPENAI_API_URL в .env');
    }
    if (!env.openAiApiKey) {
      throw new Error('Не задан VITE_OPENAI_API_KEY в .env');
    }

    return postJson<ChatCompletionResponse>(env.openAiApiUrl, body, {
      Authorization: `Bearer ${env.openAiApiKey}`,
    });
  },
};
