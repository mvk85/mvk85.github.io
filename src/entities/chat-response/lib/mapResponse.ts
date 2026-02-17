import type { ChatCompletionResponse } from '@/entities/chat-response/model/types';

export function mapChatResponseToText(response: ChatCompletionResponse): string {
  const text = response.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error('Сервер вернул пустой ответ модели.');
  }

  return text;
}
