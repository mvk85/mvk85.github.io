import { describe, expect, it } from 'vitest';

import { buildContextByStrategy } from '../src/entities/chat/lib/contextStrategies';
import type { ChatMessage, ChatStrategySettings } from '../src/entities/chat/model/types';

function createSettings(overrides: Partial<ChatStrategySettings> = {}): ChatStrategySettings {
  return {
    strategy1WindowSize: 10,
    strategy2WindowSize: 10,
    strategy2Facts: {},
    ...overrides,
  };
}

function createMessages(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    role: (index + 1) % 2 === 0 ? 'assistant' : 'user',
    content: `message-${index + 1}`,
  }));
}

describe('context strategies', () => {
  it('strategy-1 отправляет только последние N сообщений', () => {
    const messages = createMessages(12);

    const context = buildContextByStrategy('strategy-1', messages, createSettings({ strategy1WindowSize: 10 }));

    expect(context).toHaveLength(10);
    expect(context.map((message) => message.content)).toEqual([
      'message-3',
      'message-4',
      'message-5',
      'message-6',
      'message-7',
      'message-8',
      'message-9',
      'message-10',
      'message-11',
      'message-12',
    ]);
  });

  it('strategy-2 отправляет facts + последние N сообщений', () => {
    const messages = createMessages(6);
    const context = buildContextByStrategy(
      'strategy-2',
      messages,
      createSettings({
        strategy2WindowSize: 2,
        strategy2Facts: {
          goal: 'Подготовить короткий доклад',
          deadline: 'Пятница',
        },
      }),
    );

    expect(context).toHaveLength(3);
    expect(context[0].role).toBe('system');
    expect(context[0].content).toContain('"goal": "Подготовить короткий доклад"');
    expect(context[0].content).toContain('"deadline": "Пятница"');
    expect(context[1].content).toBe('message-5');
    expect(context[2].content).toBe('message-6');
  });

  it('strategy-3 отправляет всю историю (fallback)', () => {
    const messages = createMessages(4);

    const context = buildContextByStrategy('strategy-3', messages, createSettings());

    expect(context).toHaveLength(4);
    expect(context.map((message) => message.content)).toEqual(['message-1', 'message-2', 'message-3', 'message-4']);
  });

  it('strategy-1 при невалидном N использует значение по умолчанию 10', () => {
    const messages = createMessages(15);

    const context = buildContextByStrategy('strategy-1', messages, createSettings({ strategy1WindowSize: 0 }));

    expect(context).toHaveLength(10);
    expect(context[0].content).toBe('message-6');
    expect(context[9].content).toBe('message-15');
  });

  it('strategy-2 поддерживает N=0: отправляется только system с facts', () => {
    const messages = createMessages(4);

    const context = buildContextByStrategy(
      'strategy-2',
      messages,
      createSettings({
        strategy2WindowSize: 0,
        strategy2Facts: { decision: 'Использовать стратегию 2' },
      }),
    );

    expect(context).toHaveLength(1);
    expect(context[0].role).toBe('system');
    expect(context[0].content).toContain('"decision": "Использовать стратегию 2"');
  });
});
