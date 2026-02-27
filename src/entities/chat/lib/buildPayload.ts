import type { ChatCompletionPayload, LlmMessage } from '@/entities/chat/model/types';

export function buildChatCompletionPayload(messages: LlmMessage[], model: string): ChatCompletionPayload {
  return {
    model,
    messages,
  };
}
