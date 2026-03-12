import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveMcpGithubAssistantText } from '../src/processes/chat-agent/lib/mcpGithubRuntime';

const fetchMock = vi.fn();

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
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      configurable: true,
    });
    fetchMock.mockReset();
  });

  it('returns enabled capabilities text with examples', async () => {
    const text = await resolveMcpGithubAssistantText(
      '{"type":"mcp","method":"github","value":"info","setting":{"enable":true,"query":""}}',
    );

    expect(text).toContain('MCP GitHub включен.');
    expect(text).toContain('Пример: "найди репозиторий react router в github"');
    expect(text).toContain('Пример: "выведи список моих репозиториев"');
    expect(text).toContain('Пример: "выведи количество звезд репозитория openclaw/openclaw"');
  });

  it('returns disabled capabilities text when enable=false', async () => {
    const text = await resolveMcpGithubAssistantText(
      '{"type":"mcp","method":"github","value":"info","setting":{"enable":false,"query":""}}',
    );

    expect(text).toContain('MCP GitHub выключен.');
    expect(text).toContain('включите MCP в настройках агента');
  });
});

describe('mcp github runtime get_repo_stars', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      configurable: true,
    });
    fetchMock.mockReset();
  });

  it('returns repository name and stars count', async () => {
    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () =>
        JSON.stringify({
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  stars_count: 305110,
                }),
              },
            ],
          },
        }),
    });

    const text = await resolveMcpGithubAssistantText(
      '{"type":"mcp","method":"github","value":"get_repo_stars","setting":{"enable":true,"query":"openclaw/openclaw"}}',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3001/mcp/github/tools/get_repo_stars/invoke');
    expect(init.method).toBe('POST');
    expect(String(init.body)).toContain('"owner":"openclaw"');
    expect(String(init.body)).toContain('"repo":"openclaw"');
    expect(text).toContain('Репозиторий: openclaw/openclaw.');
    expect(text).toContain('Количество звезд: 305110.');
  });

  it('returns validation message when query is empty', async () => {
    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    const text = await resolveMcpGithubAssistantText(
      '{"type":"mcp","method":"github","value":"get_repo_stars","setting":{"enable":true,"query":""}}',
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(text).toContain('Нужно указать репозиторий в формате owner/repo.');
    expect(text).toContain('https://github.com/openclaw/openclaw');
  });
});
