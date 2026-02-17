import type { ChatCompletionResponse } from '@/entities/chat-response/model/types';
import { env } from '@/shared/config/env';
import { postJson } from '@/shared/api/client';

type CreateCompletionParams = {
  userMessage: string;
};

export const chatApi = {
  createCompletion: async ({ userMessage }: CreateCompletionParams): Promise<ChatCompletionResponse> => {
    return postJson<ChatCompletionResponse>(
      env.apiUrl,
      {
        model: env.model,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      },
      {
        Authorization: `Bearer ${env.apiKey}`,
      },
    );
  },
};
