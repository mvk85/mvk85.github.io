import { describe, expect, it } from 'vitest';

import { parseLongTermMemory, parseWorkingMemory, prependMemoryToContext } from '../src/entities/chat/lib/memoryService';
import type { LongTermMemoryItem, WorkingMemory } from '../src/entities/chat/model/types';

describe('memory service', () => {
  it('нормализует working memory и генерирует task.id на клиенте', () => {
    const working = parseWorkingMemory(
      JSON.stringify({
        goal: 'Подготовить релиз',
        tasks: [
          {
            title: 'Проверить чеклист',
            status: 'in_progress',
          },
        ],
        current_focus: 'Тесты',
        constraints: ['до пятницы'],
      }),
    );

    expect(working.goal).toBe('Подготовить релиз');
    expect(working.tasks).toHaveLength(1);
    expect(working.tasks[0].id).toBe('task_auto_001');
    expect(working.tasks[0].status).toBe('in_progress');
  });

  it('нормализует long-term memory и ограничивает до 100 пунктов', () => {
    const rawItems = Array.from({ length: 120 }, (_, index) => ({
      kind: 'preference',
      text: `fact-${index + 1}`,
      confidence: 0.7,
      updated_at: '2026-03-03T00:00:00.000Z',
    }));
    const items = parseLongTermMemory(JSON.stringify({ items: rawItems }));

    expect(items).toHaveLength(100);
    expect(items[0].text).toBe('fact-21');
    expect(items[99].text).toBe('fact-120');
  });

  it('добавляет memory system messages только если память непустая', () => {
    const context = [{ role: 'user' as const, content: 'Привет' }];
    const workingMemory: WorkingMemory = {
      goal: 'Сделать задачу',
      tasks: [],
      current_focus: null,
      constraints: [],
      updated_at: '2026-03-03T00:00:00.000Z',
    };
    const longTermMemory: LongTermMemoryItem[] = [
      {
        id: 'm1',
        kind: 'profile',
        text: 'Пользователь разработчик',
        confidence: 0.9,
        updated_at: '2026-03-03T00:00:00.000Z',
      },
    ];

    const withoutMemory = prependMemoryToContext(context, null, []);
    expect(withoutMemory).toEqual(context);

    const withMemory = prependMemoryToContext(context, workingMemory, longTermMemory);
    expect(withMemory).toHaveLength(3);
    expect(withMemory[0].role).toBe('system');
    expect(withMemory[1].role).toBe('system');
    expect(withMemory[2]).toEqual(context[0]);
  });
});
