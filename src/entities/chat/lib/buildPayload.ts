import type { ChatCompletionPayload, LlmMessage } from '@/entities/chat/model/types';

export function buildChatCompletionPayload(
  messages: LlmMessage[],
  model: string,
  options?: Pick<ChatCompletionPayload, 'temperature' | 'num_predict' | 'num_ctx'>,
): ChatCompletionPayload {
  return {
    model,
    messages,
    ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(options?.num_predict !== undefined ? { num_predict: options.num_predict } : {}),
    ...(options?.num_ctx !== undefined ? { num_ctx: options.num_ctx } : {}),
  };
}
