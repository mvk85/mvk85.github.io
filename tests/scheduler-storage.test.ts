import { beforeEach, describe, expect, it } from 'vitest';

import { loadScheduledEvents, saveScheduledEvents, SCHEDULED_EVENTS_STORAGE_KEY } from '../src/processes/chat-agent/lib/schedulerStorage';

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

describe('scheduler storage', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
    });
  });

  it('saves and loads scheduled events', () => {
    saveScheduledEvents([
      {
        id: 'a',
        action: 'test action',
        intervalSeconds: 60,
        repeat: { mode: 'count', totalRuns: 3, remainingRuns: 3 },
        createdAt: '2026-03-12T00:00:00.000Z',
        nextRunAt: '2026-03-12T00:01:00.000Z',
      },
    ]);

    const loaded = loadScheduledEvents();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].action).toBe('test action');
  });

  it('filters invalid payloads', () => {
    localStorage.setItem(
      SCHEDULED_EVENTS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'bad',
          action: '',
          intervalSeconds: 1,
          repeat: { mode: 'count', totalRuns: 1, remainingRuns: 1 },
          createdAt: '2026-03-12T00:00:00.000Z',
          nextRunAt: '2026-03-12T00:01:00.000Z',
        },
      ]),
    );

    expect(loadScheduledEvents()).toEqual([]);
  });
});
