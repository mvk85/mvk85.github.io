import type { ChatCompletionPayload } from '@/entities/chat/model/types';
import type { ChatCompletionResponse } from '@/entities/chat-response/model/types';
import { getJson, postJson } from '@/shared/api/client';
import { env } from '@/shared/config/env';

type BalanceResponse = {
  balance: number;
};

export const openAiProxyChatApi = {
  createChatCompletion: async (body: ChatCompletionPayload, options?: { signal?: AbortSignal }): Promise<ChatCompletionResponse> => {
    if (!env.openAiApiUrl) {
      throw new Error('Не задан VITE_OPENAI_API_URL в .env');
    }
    if (!env.openAiApiKey) {
      throw new Error('Не задан VITE_OPENAI_API_KEY в .env');
    }

    return postJson<ChatCompletionResponse>(
      env.openAiApiUrl,
      body,
      {
        Authorization: `Bearer ${env.openAiApiKey}`,
      },
      options,
    );
  },
  getBalance: async (options?: { signal?: AbortSignal }): Promise<number> => {
    if (!env.openAiApiKey) {
      throw new Error('Не задан VITE_OPENAI_API_KEY или VITE_PROXYAPI_API_KEY в .env');
    }

    const response = await getJson<BalanceResponse>(
      env.proxyApiBalanceUrl,
      {
        Authorization: `Bearer ${env.openAiApiKey}`,
      },
      options,
    );

    if (typeof response.balance !== 'number' || !Number.isFinite(response.balance)) {
      throw new Error('Сервер вернул некорректный формат баланса.');
    }

    return response.balance;
  },
};
