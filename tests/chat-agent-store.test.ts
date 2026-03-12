import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const createChatCompletionMock = vi.fn();
const getBalanceMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('../src/shared/api/openAiProxyChatApi', () => ({
  openAiProxyChatApi: {
    createChatCompletion: (...args: unknown[]) => createChatCompletionMock(...args),
    getBalance: (...args: unknown[]) => getBalanceMock(...args),
  },
}));

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
  Object.defineProperty(globalThis, 'fetch', {
    value: fetchMock,
    configurable: true,
  });
  createChatCompletionMock.mockReset();
  getBalanceMock.mockReset();
  fetchMock.mockReset();
});

describe('chat agent store', () => {
  it('aborts in-flight request when clearChat is called', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    getBalanceMock.mockResolvedValue(100);

    createChatCompletionMock.mockImplementation((_payload: unknown, options?: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        });
      });
    });

    const store = createChatAgentStore();
    store.getState().setInputValue('привет');

    const requestPromise = store.getState().sendUserMessage();
    store.getState().clearChat();
    await requestPromise;

    expect(store.getState().status).toBe('idle');
    expect(store.getState().errorMessage).toBeNull();
    expect(store.getState().currentChat.messages).toHaveLength(0);
  });

  it('injects MCP github system prompt only into main LLM payload', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    getBalanceMock.mockResolvedValueOnce(100).mockResolvedValueOnce(99);

    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    createChatCompletionMock
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"goal":"g","tasks":[],"current_focus":"f","constraints":[],"updated_at":"2026-03-11T00:00:00.000Z"}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"items":[]}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

    const store = createChatAgentStore();
    store.getState().setInputValue('github выведи список моих репозиториев');
    await store.getState().sendUserMessage();

    expect(createChatCompletionMock).toHaveBeenCalledTimes(3);

    const memoryPayload = createChatCompletionMock.mock.calls[0]?.[0] as { messages: Array<{ content: string }> };
    const longTermPayload = createChatCompletionMock.mock.calls[1]?.[0] as { messages: Array<{ content: string }> };
    const mainPayload = createChatCompletionMock.mock.calls[2]?.[0] as { messages: Array<{ content: string }> };

    const mainPayloadText = mainPayload.messages.map((message) => message.content).join('\n');
    const memoryPayloadText = memoryPayload.messages.map((message) => message.content).join('\n');
    const longTermPayloadText = longTermPayload.messages.map((message) => message.content).join('\n');

    expect(mainPayloadText).toContain('# MCP GitHub Serve Mode');
    expect(mainPayloadText).toContain('mcp_github_enabled = true');
    expect(memoryPayloadText).not.toContain('# MCP GitHub Serve Mode');
    expect(longTermPayloadText).not.toContain('# MCP GitHub Serve Mode');
  });

  it('uses selected chat model in LLM requests and derived state', async () => {
    const { createChatAgentStore, getChatAgentDerived } = await import('../src/processes/chat-agent/model/store');
    getBalanceMock.mockResolvedValueOnce(100).mockResolvedValueOnce(99);

    createChatCompletionMock
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"goal":"g","tasks":[],"current_focus":"f","constraints":[],"updated_at":"2026-03-11T00:00:00.000Z"}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"items":[]}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

    const store = createChatAgentStore();
    expect(getChatAgentDerived(store.getState()).model).toBe('gpt-5.1');

    store.getState().setCurrentChatModel('gpt-5-mini');
    expect(getChatAgentDerived(store.getState()).model).toBe('gpt-5-mini');

    store.getState().setInputValue('проверь модель');
    await store.getState().sendUserMessage();

    expect(createChatCompletionMock).toHaveBeenCalledTimes(3);
    for (const [payload] of createChatCompletionMock.mock.calls) {
      expect((payload as { model: string }).model).toBe('gpt-5-mini');
    }
  });

  it('does not surface UI error when balance does not decrease', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    getBalanceMock.mockResolvedValueOnce(100).mockResolvedValueOnce(100);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    createChatCompletionMock
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"goal":"g","tasks":[],"current_focus":"f","constraints":[],"updated_at":"2026-03-11T00:00:00.000Z"}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"items":[]}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

    try {
      const store = createChatAgentStore();
      store.getState().setInputValue('проверь стоимость');
      await store.getState().sendUserMessage();

      expect(store.getState().status).toBe('success');
      expect(store.getState().errorMessage).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        '[chat-agent] cost calculation skipped: balance did not decrease',
        expect.objectContaining({
          balanceBefore: 100,
          balanceAfter: 100,
          requestCost: 0,
        }),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('handles MCP github my_repo_list JSON response and renders repository links', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    getBalanceMock.mockResolvedValueOnce(100).mockResolvedValueOnce(99);

    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
        username: 'mvk85',
      }),
    );

    createChatCompletionMock
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"goal":"g","tasks":[],"current_focus":"f","constraints":[],"updated_at":"2026-03-11T00:00:00.000Z"}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"items":[]}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content:
                '{"type":"mcp","method":"github","value":"my_repo_list","setting":{"enable":true,"query":""}}',
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

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
                  total_count: 1,
                  items: [
                    {
                      name: 'backend_challenge',
                      full_name: 'mvk85/backend_challenge',
                      html_url: 'https://github.com/mvk85/backend_challenge',
                    },
                  ],
                }),
              },
            ],
          },
        }),
    });

    const store = createChatAgentStore();
    store.getState().setInputValue('выведи список моих репозиториев');
    await store.getState().sendUserMessage();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3001/mcp/github/tools/search_repositories/invoke');
    expect(init.method).toBe('POST');
    expect(String(init.body)).toContain('user:mvk85 in:name');

    const assistantMessages = store
      .getState()
      .currentChat.messages.filter((message) => message.role === 'assistant');
    const assistantMessage = assistantMessages[assistantMessages.length - 1];

    expect(assistantMessage?.content).toContain('Список репозиториев пользователя "mvk85"');
    expect(assistantMessage?.content).toContain('[mvk85/backend_challenge](https://github.com/mvk85/backend_challenge)');
    expect(assistantMessage?.content).not.toContain('"type":"mcp"');
  });

  it('handles MCP github get_repo_stars JSON response and renders stars count', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    getBalanceMock.mockResolvedValueOnce(100).mockResolvedValueOnce(99);

    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    createChatCompletionMock
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"goal":"g","tasks":[],"current_focus":"f","constraints":[],"updated_at":"2026-03-11T00:00:00.000Z"}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"items":[]}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content:
                '{"type":"mcp","method":"github","value":"get_repo_stars","setting":{"enable":true,"query":"openclaw/openclaw"}}',
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

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

    const store = createChatAgentStore();
    store.getState().setInputValue('выведи количество звезд репозитория openclaw/openclaw');
    await store.getState().sendUserMessage();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3001/mcp/github/tools/get_repo_stars/invoke');
    expect(init.method).toBe('POST');
    expect(String(init.body)).toContain('"owner":"openclaw"');
    expect(String(init.body)).toContain('"repo":"openclaw"');

    const assistantMessages = store
      .getState()
      .currentChat.messages.filter((message) => message.role === 'assistant');
    const assistantMessage = assistantMessages[assistantMessages.length - 1];

    expect(assistantMessage?.content).toContain('Репозиторий: openclaw/openclaw.');
    expect(assistantMessage?.content).toContain('Количество звезд: 305110.');
    expect(assistantMessage?.content).not.toContain('"type":"mcp"');
  });
});
