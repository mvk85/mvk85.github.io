import { beforeEach, describe, expect, it } from 'vitest';

import { loadChatStats } from '../src/features/chat/model/useChat';

const CHAT_STATS_STORAGE_KEY = 'chat_stats_v1';

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

describe('chat stats migration', () => {
  it('читает только актуальный формат per-chat', () => {
    localStorage.setItem(
      CHAT_STATS_STORAGE_KEY,
      JSON.stringify({
        previousBalance: 100,
        byChat: {
          'chat-1': {
            model: 'gpt-5.1',
            totalCost: 0.1,
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30,
          },
        },
      }),
    );

    const migrated = loadChatStats('chat-1');

    expect(migrated).toEqual({
      previousBalance: 100,
      byChat: {
        'chat-1': {
          model: 'gpt-5.1',
          totalCost: 0.1,
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      },
    });
  });

  it('бросает ошибку на неактуальный формат', () => {
    localStorage.setItem(
      CHAT_STATS_STORAGE_KEY,
      JSON.stringify({
        previousBalance: 42,
        lastResponse: {
          model: 'gpt-5.1',
          promptTokens: 7,
          completionTokens: 11,
          totalTokens: 18,
          requestCost: 0.05,
        },
        items: [
          {
            id: 'r1',
            chatId: '',
            model: 'gpt-5.1',
            promptTokens: 3,
            completionTokens: 5,
            totalTokens: 8,
            requestCost: 0.02,
          },
          {
            id: 'r2',
            chatId: '',
            model: 'gpt-5.1',
            promptTokens: 4,
            completionTokens: 6,
            totalTokens: 10,
            requestCost: 0.03,
          },
        ],
        totalCost: 0.05,
      }),
    );

    expect(() => loadChatStats('chat-current')).toThrowError('Некорректный формат chat stats');
  });
});
