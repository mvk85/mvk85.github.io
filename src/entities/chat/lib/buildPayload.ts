import type { ChatCompletionPayload, ChatMessage } from '@/entities/chat/model/types';
import { env } from '@/shared/config/env';

export function buildChatCompletionPayload(messages: ChatMessage[]): ChatCompletionPayload {
  return {
    model: env.openAiModel,
    messages,
  };
}
