import type { ChatContextStrategy, ChatMessage, ChatStrategySettings, LlmMessage, Strategy2Facts } from '@/entities/chat/model/types';

function toLlmMessages(messages: ChatMessage[]): LlmMessage[] {
  return messages.map((message) => ({ role: message.role, content: message.content }));
}

function normalizePositiveInteger(value: number): number {
  return Number.isInteger(value) && value > 0 ? value : 10;
}

function normalizeNonNegativeInteger(value: number): number {
  return Number.isInteger(value) && value >= 0 ? value : 10;
}

function serializeFacts(facts: Strategy2Facts): string {
  return JSON.stringify(facts, null, 2);
}

function buildStrategy2FactsSystemPrompt(facts: Strategy2Facts): LlmMessage {
  return {
    role: 'system',
    content: `Ты полезный и точный ассистент.
Учитывай накопленные факты пользователя и недавний контекст.

Накопленные facts (key-value):
${serializeFacts(facts)}

Правила:
- Facts — приоритетный долгосрочный контекст.
- Если недавние сообщения конфликтуют с facts, уточни у пользователя.
- Отвечай по сути, без выдумок.
- Если данных недостаточно, задай короткий уточняющий вопрос.`,
  };
}

export function buildContextByStrategy(
  strategy: ChatContextStrategy,
  rawMessages: ChatMessage[],
  strategySettings: ChatStrategySettings,
): LlmMessage[] {
  if (strategy === 'strategy-1') {
    return toLlmMessages(rawMessages.slice(-normalizePositiveInteger(strategySettings.strategy1WindowSize)));
  }

  if (strategy === 'strategy-2') {
    const strategy2WindowSize = normalizeNonNegativeInteger(strategySettings.strategy2WindowSize);
    const limitedMessages = strategy2WindowSize === 0 ? [] : rawMessages.slice(-strategy2WindowSize);

    return [buildStrategy2FactsSystemPrompt(strategySettings.strategy2Facts), ...toLlmMessages(limitedMessages)];
  }

  return toLlmMessages(rawMessages);
}
