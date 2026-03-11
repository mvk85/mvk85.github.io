import { beforeEach, describe, expect, it } from 'vitest';

import { resolveMcpGithubAssistantText } from '../src/processes/chat-agent/lib/mcpGithubRuntime';

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

describe('mcp github runtime info', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
    });
  });

  it('returns enabled capabilities text with examples', async () => {
    const text = await resolveMcpGithubAssistantText(
      '{"type":"mcp","method":"github","value":"info","setting":{"enable":true,"query":""}}',
    );

    expect(text).toContain('MCP GitHub включен.');
    expect(text).toContain('Пример: "найди репозиторий react router в github"');
    expect(text).toContain('Пример: "выведи список моих репозиториев"');
  });

  it('returns disabled capabilities text when enable=false', async () => {
    const text = await resolveMcpGithubAssistantText(
      '{"type":"mcp","method":"github","value":"info","setting":{"enable":false,"query":""}}',
    );

    expect(text).toContain('MCP GitHub выключен.');
    expect(text).toContain('включите MCP в настройках агента');
  });
});
