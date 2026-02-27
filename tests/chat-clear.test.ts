import { beforeEach, describe, expect, it } from 'vitest';

import { resetChatMessages, saveChatMessages } from '../src/entities/chat/lib/storage';
import { resetChatSummaryState, saveChatSummaryState } from '../src/entities/chat/lib/summaryStorage';

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

describe('Chat cleanup', () => {
  it('Очистка чата удаляет raw и summary-данные', () => {
    saveChatMessages([{ id: 1, role: 'user', content: 'hello' }]);
    saveChatSummaryState({ summaryText: 'summary', coveredUntilMessageId: 1, updatedAt: '2026-01-01T00:00:00.000Z' });

    const messagesAfterReset = resetChatMessages();
    const summaryAfterReset = resetChatSummaryState();

    expect(messagesAfterReset).toEqual([]);
    expect(summaryAfterReset).toEqual({ summaryText: '', coveredUntilMessageId: null, updatedAt: null });
  });
});
