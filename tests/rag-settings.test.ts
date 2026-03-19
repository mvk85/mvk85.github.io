import { beforeEach, describe, expect, it } from 'vitest';

import { loadRagSettings, saveRagSettings } from '../src/processes/chat-agent/lib/ragSettings';

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

describe('rag settings', () => {
  it('keeps askClarificationOnLowRelevance disabled by default', () => {
    const settings = loadRagSettings();
    expect(settings.askClarificationOnLowRelevance).toBe(false);
  });

  it('normalizes askClarificationOnLowRelevance from invalid persisted value', () => {
    localStorage.setItem(
      'rag_settings_v1',
      JSON.stringify({
        enabled: true,
        askClarificationOnLowRelevance: 'yes',
      }),
    );

    const settings = loadRagSettings();
    expect(settings.askClarificationOnLowRelevance).toBe(false);
  });

  it('persists askClarificationOnLowRelevance setting', () => {
    saveRagSettings({
      ...loadRagSettings(),
      askClarificationOnLowRelevance: true,
    });

    const nextSettings = loadRagSettings();
    expect(nextSettings.askClarificationOnLowRelevance).toBe(true);
  });
});
