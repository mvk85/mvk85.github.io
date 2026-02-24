import type { ChatCompletionPayload, ChatMessage } from '@/entities/chat/model/types';

export function buildChatCompletionPayload(messages: ChatMessage[]): ChatCompletionPayload {
  return {
    model: 'gpt-4o',
    messages,
  };
}

