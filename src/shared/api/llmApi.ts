import type { ChatCompletionPayload, LlmMessage } from '@/entities/chat/model/types';
import type { ChatCompletionResponse } from '@/entities/chat-response/model/types';
import { postJson } from '@/shared/api/client';
import { env } from '@/shared/config/env';
import { openAiProxyChatApi } from '@/shared/api/openAiProxyChatApi';

type OllamaGenerateResponse = {
  model?: unknown;
  created_at?: unknown;
  response?: unknown;
  done_reason?: unknown;
  prompt_eval_count?: unknown;
  eval_count?: unknown;
};

type OllamaGenerateOptions = {
  temperature?: number;
  num_predict?: number;
  num_ctx?: number;
};

const OLLAMA_MODEL_PREFIX = 'qwen2.5:';

function isOllamaModel(model: string): boolean {
  return model.startsWith(OLLAMA_MODEL_PREFIX);
}

function formatPromptMessage(message: LlmMessage): string {
  if (message.role === 'system') {
    return `System: ${message.content}`;
  }
  if (message.role === 'assistant') {
    return `Assistant: ${message.content}`;
  }
  return `User: ${message.content}`;
}

function buildOllamaPrompt(messages: LlmMessage[]): string {
  const lines = messages.map(formatPromptMessage);
  lines.push('Assistant:');
  return lines.join('\n\n');
}

function toTimestampSeconds(raw: unknown): number {
  if (typeof raw === 'string') {
    const parsed = new Date(raw).getTime();
    if (Number.isFinite(parsed)) {
      return Math.floor(parsed / 1000);
    }
  }
  return Math.floor(Date.now() / 1000);
}

function toNonNegativeNumber(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return 0;
  }
  if (raw < 0) {
    return 0;
  }
  return raw;
}

function mapOllamaGenerateResponse(response: OllamaGenerateResponse, requestedModel: string): ChatCompletionResponse {
  if (typeof response.response !== 'string' || response.response.trim().length === 0) {
    throw new Error('Локальная модель вернула пустой ответ.');
  }

  const promptTokens = toNonNegativeNumber(response.prompt_eval_count);
  const completionTokens = toNonNegativeNumber(response.eval_count);

  return {
    id: `ollama_${Date.now()}`,
    created: toTimestampSeconds(response.created_at),
    model: typeof response.model === 'string' && response.model.trim().length > 0 ? response.model : requestedModel,
    object: 'chat.completion',
    choices: [
      {
        finish_reason: typeof response.done_reason === 'string' ? response.done_reason : null,
        index: 0,
        message: {
          role: 'assistant',
          content: response.response,
        },
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

function buildOllamaOptions(body: ChatCompletionPayload): OllamaGenerateOptions | undefined {
  const options: OllamaGenerateOptions = {};
  if (body.temperature !== undefined) {
    options.temperature = body.temperature;
  }
  if (body.num_predict !== undefined) {
    options.num_predict = body.num_predict;
  }
  if (body.num_ctx !== undefined) {
    options.num_ctx = body.num_ctx;
  }

  return Object.keys(options).length > 0 ? options : undefined;
}

export const llmApi = {
  createChatCompletion: async (body: ChatCompletionPayload, options?: { signal?: AbortSignal }): Promise<ChatCompletionResponse> => {
    if (!isOllamaModel(body.model)) {
      return openAiProxyChatApi.createChatCompletion(body, options);
    }

    if (!env.ollamaApiUrl) {
      throw new Error('Не задан VITE_OLLAMA_API_URL в .env');
    }

    const ollamaOptions = buildOllamaOptions(body);
    const ollamaResponse = await postJson<OllamaGenerateResponse>(
      env.ollamaApiUrl,
      {
        model: body.model,
        prompt: buildOllamaPrompt(body.messages),
        stream: false,
        ...(ollamaOptions ? { options: ollamaOptions } : {}),
      },
      {},
      options,
    );

    return mapOllamaGenerateResponse(ollamaResponse, body.model);
  },
  getBalance: async (options?: { signal?: AbortSignal }): Promise<number> => openAiProxyChatApi.getBalance(options),
};
