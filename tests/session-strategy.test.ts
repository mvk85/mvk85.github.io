import { beforeEach, describe, expect, it } from 'vitest';

import { CHAT_SESSIONS_STORAGE_KEY } from '../src/entities/chat/lib/constants';
import { createBranchedChatSession, createChatSession, createEmptyChatSession, loadChatSessionsState } from '../src/entities/chat/lib/sessionStorage';

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

describe('chat strategy storage', () => {
  it('по умолчанию новый чат создается с strategy-1 и window=10', () => {
    const chat = createEmptyChatSession();

    expect(chat.contextStrategy).toBe('strategy-1');
    expect(chat.parentChatId).toBeNull();
    expect(chat.strategySettings.strategy1WindowSize).toBe(10);
    expect(chat.strategySettings.strategy2WindowSize).toBe(10);
    expect(chat.strategySettings.strategy2Facts).toEqual({});
  });

  it('стратегия сохраняется при явном создании чата', () => {
    const chat = createChatSession({ contextStrategy: 'strategy-3' });

    expect(chat.contextStrategy).toBe('strategy-3');
    expect(chat.parentChatId).toBeNull();
    expect(chat.strategySettings.strategy1WindowSize).toBe(10);
    expect(chat.strategySettings.strategy2WindowSize).toBe(10);
    expect(chat.strategySettings.strategy2Facts).toEqual({});
  });

  it('старые сохраненные чаты без стратегии мигрируются в strategy-1', () => {
    localStorage.setItem(
      CHAT_SESSIONS_STORAGE_KEY,
      JSON.stringify({
        currentChat: {
          id: 'chat-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          messages: [{ id: 1, role: 'user', content: 'hello' }],
          summaryState: { summaryText: '', coveredUntilMessageId: null, updatedAt: null },
        },
        chatHistory: [
          {
            id: 'chat-2',
            createdAt: '2026-01-02T00:00:00.000Z',
            messages: [{ id: 1, role: 'assistant', content: 'hi' }],
            summaryState: { summaryText: '', coveredUntilMessageId: null, updatedAt: null },
          },
        ],
      }),
    );

    const state = loadChatSessionsState();

    expect(state).not.toBeNull();
    expect(state?.currentChat.contextStrategy).toBe('strategy-1');
    expect(state?.currentChat.parentChatId).toBeNull();
    expect(state?.currentChat.strategySettings.strategy1WindowSize).toBe(10);
    expect(state?.currentChat.strategySettings.strategy2WindowSize).toBe(10);
    expect(state?.currentChat.strategySettings.strategy2Facts).toEqual({});
    expect(state?.chatHistory[0].contextStrategy).toBe('strategy-1');
    expect(state?.chatHistory[0].parentChatId).toBeNull();
    expect(state?.chatHistory[0].strategySettings.strategy1WindowSize).toBe(10);
    expect(state?.chatHistory[0].strategySettings.strategy2WindowSize).toBe(10);
    expect(state?.chatHistory[0].strategySettings.strategy2Facts).toEqual({});
  });

  it('создает ветку с parentChatId, инкрементным суффиксом и полным клонированием', () => {
    const parent = createChatSession({
      id: 'chat-parent',
      title: 'План проекта',
      contextStrategy: 'strategy-3',
      messages: [
        { id: 1, role: 'user', content: 'Собери требования' },
        { id: 2, role: 'assistant', content: 'Готово' },
      ],
      summaryState: { summaryText: 'summary', coveredUntilMessageId: 2, updatedAt: '2026-02-01T00:00:00.000Z' },
      strategySettings: {
        strategy1WindowSize: 7,
        strategy2WindowSize: 3,
        strategy2Facts: { focus: 'frontend' },
      },
    });

    const firstBranch = createBranchedChatSession(parent, [parent]);
    const secondBranch = createBranchedChatSession(parent, [parent, firstBranch]);

    expect(firstBranch.id).not.toBe(parent.id);
    expect(firstBranch.parentChatId).toBe(parent.id);
    expect(firstBranch.title).toBe('План проекта_ветка_1');
    expect(firstBranch.contextStrategy).toBe(parent.contextStrategy);
    expect(firstBranch.messages).toEqual(parent.messages);
    expect(firstBranch.messages).not.toBe(parent.messages);
    expect(firstBranch.strategySettings).toEqual(parent.strategySettings);
    expect(firstBranch.strategySettings).not.toBe(parent.strategySettings);
    expect(firstBranch.summaryState).toEqual(parent.summaryState);
    expect(firstBranch.summaryState).not.toBe(parent.summaryState);

    expect(secondBranch.title).toBe('План проекта_ветка_2');
    expect(secondBranch.parentChatId).toBe(parent.id);
  });
});
