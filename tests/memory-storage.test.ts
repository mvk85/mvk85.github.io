import { beforeEach, describe, expect, it } from 'vitest';

import { loadLongTermMemory, resetLongTermMemory, saveLongTermMemory } from '../src/entities/chat/lib/longTermMemoryStorage';
import { deleteWorkingMemoryForChat } from '../src/entities/chat/lib/workingMemoryStorage';
import type { WorkingMemory } from '../src/entities/chat/model/types';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
});

describe('memory storage', () => {
  it('очищает долговременную память', () => {
    saveLongTermMemory([
      {
        id: 'm1',
        kind: 'profile',
        text: 'Пользователь из Москвы',
        confidence: 0.8,
        updated_at: '2026-03-03T00:00:00.000Z',
      },
    ]);

    expect(loadLongTermMemory()).toHaveLength(1);
    expect(resetLongTermMemory()).toEqual([]);
    expect(loadLongTermMemory()).toEqual([]);
  });

  it('удаляет working memory конкретного чата', () => {
    const working: WorkingMemory = {
      goal: 'Цель',
      tasks: [],
      current_focus: null,
      constraints: [],
      updated_at: '2026-03-03T00:00:00.000Z',
    };
    const map = {
      'chat-1': working,
      'chat-2': working,
    };

    const next = deleteWorkingMemoryForChat(map, 'chat-1');
    expect(next).toEqual({ 'chat-2': working });
  });
});
