import type { ChatCompletionResponse } from '@/entities/chat-response/model/types';
import { env } from '@/shared/config/env';
import { postJson } from '@/shared/api/client';

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ScenarioReply = {
  kind: 'question' | 'final';
  text: string;
};

const SYSTEM_PROMPT = `Ты — помощник, который проводит короткую проверку перед рекомендацией покупки машины.
Правила диалога:
1) Если возраст ещё неизвестен — задай ровно один вопрос: 'Вам больше 18 лет?'
2) Если возраст известен и <= 18 — ответь: 'Спасибо за информацию, вы не можете купить машину для перемещения.' и остановись.
3) Если возраст известен и > 18, но нет информации о правах — задай ровно один вопрос: 'У вас есть водительское удостоверение категории В?'
4) Если права есть — ответь: 'Спасибо за информацию, вы можете купить себе машину для перемещения.' и остановись.
5) Если прав нет — ответь: 'Спасибо за информацию, сейчас лучше не покупать машину для перемещения.' и остановись.
Формат: отвечай только одной фразой (вопрос или финальный ответ), без пояснений.
Верни ответ строго JSON-объектом: {"kind":"question"|"final","text":"..."}.`;

type CreateCompletionParams = {
  messages: ConversationMessage[];
};

function mapContentToScenarioReply(content: string): ScenarioReply {
  const parsed = JSON.parse(content) as Partial<ScenarioReply>;

  if ((parsed.kind !== 'question' && parsed.kind !== 'final') || typeof parsed.text !== 'string' || parsed.text.trim() === '') {
    throw new Error('Модель вернула невалидный формат ответа.');
  }

  return {
    kind: parsed.kind,
    text: parsed.text.trim(),
  };
}

export const chatApi = {
  createCompletion: async ({ messages }: CreateCompletionParams): Promise<ScenarioReply> => {
    const response = await postJson<ChatCompletionResponse>(
      env.apiUrl,
      {
        model: env.model,
        temperature: 0,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'scenario_reply',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                kind: {
                  type: 'string',
                  enum: ['question', 'final'],
                },
                text: {
                  type: 'string',
                },
              },
              required: ['kind', 'text'],
            },
          },
        },
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],
      },
      {
        Authorization: `Bearer ${env.apiKey}`,
      },
    );

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Сервер вернул пустой ответ модели.');
    }

    return mapContentToScenarioReply(content);
  },
};
