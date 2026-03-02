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
  it('мигрирует формат byChat+overall в новый per-chat формат', () => {
    localStorage.setItem(
      CHAT_STATS_STORAGE_KEY,
      JSON.stringify({
        previousBalance: 100,
        byChat: {
          'chat-1': {
            lastResponse: {
              model: 'gpt-5.1',
              promptTokens: 10,
              completionTokens: 20,
              totalTokens: 30,
              requestCost: 0.1,
            },
            items: [
              {
                id: 'r1',
                chatId: 'chat-1',
                model: 'gpt-5.1',
                promptTokens: 10,
                completionTokens: 20,
                totalTokens: 30,
                requestCost: 0.1,
              },
            ],
            totalCost: 0.1,
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30,
          },
        },
        overall: {
          totalCost: 0.1,
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
          requestsCount: 1,
        },
      }),
    );

    const migrated = loadChatStats('fallback-chat');

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

  it('мигрирует старый root-формат в per-chat формат текущего чата', () => {
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

    const migrated = loadChatStats('chat-current');

    expect(migrated).toEqual({
      previousBalance: 42,
      byChat: {
        'chat-current': {
          model: 'gpt-5.1',
          totalCost: 0.05,
          promptTokens: 7,
          completionTokens: 11,
          totalTokens: 18,
        },
      },
    });
  });
});
