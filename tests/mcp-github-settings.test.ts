import { beforeEach, describe, expect, it } from 'vitest';

import {
  MCP_GITHUB_DEFAULT_USERNAME,
  loadMcpGithubSettings,
  saveMcpGithubSettings,
} from '../src/processes/chat-agent/lib/mcpGithubSettings';

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

describe('mcp github settings', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
    });
  });

  it('returns default username when nothing is stored', () => {
    const settings = loadMcpGithubSettings();

    expect(settings.enabled).toBe(false);
    expect(settings.baseUrl).toBe('');
    expect(settings.username).toBe(MCP_GITHUB_DEFAULT_USERNAME);
  });

  it('normalizes empty username to default on save', () => {
    saveMcpGithubSettings({
      enabled: true,
      baseUrl: 'http://localhost:3001/mcp',
      username: '   ',
    });

    const settings = loadMcpGithubSettings();
    expect(settings.username).toBe(MCP_GITHUB_DEFAULT_USERNAME);
  });
});
