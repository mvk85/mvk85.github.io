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

vi.mock('../src/shared/api/llmApi', () => ({
  llmApi: {
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
  localStorage.setItem(
    'chat_agent_settings_v1',
    JSON.stringify({
      requestBalance: true,
      memoryEnabled: true,
    }),
  );
});

describe('chat agent store', () => {
  it('skips balance calls when requestBalance setting is disabled', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    localStorage.setItem(
      'chat_agent_settings_v1',
      JSON.stringify({
        requestBalance: false,
        memoryEnabled: true,
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
    store.getState().setInputValue('привет');
    await store.getState().sendUserMessage();

    expect(getBalanceMock).not.toHaveBeenCalled();
    expect(store.getState().status).toBe('success');
  });

  it('skips memory LLM calls when memory setting is disabled', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    localStorage.setItem(
      'chat_agent_settings_v1',
      JSON.stringify({
        requestBalance: false,
        memoryEnabled: false,
      }),
    );

    createChatCompletionMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    });

    const store = createChatAgentStore();
    store.getState().setInputValue('привет');
    await store.getState().sendUserMessage();

    expect(createChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(store.getState().status).toBe('success');
  });

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

  it('does not inject MCP/Organizer/Pipeline system prompts when MCP is disabled', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    getBalanceMock.mockResolvedValueOnce(100).mockResolvedValueOnce(99);

    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: false,
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
    store.getState().setInputValue('обычный запрос');
    await store.getState().sendUserMessage();

    const mainPayload = createChatCompletionMock.mock.calls[2]?.[0] as { messages: Array<{ content: string }> };
    const mainPayloadText = mainPayload.messages.map((message) => message.content).join('\n');

    expect(mainPayloadText).not.toContain('# MCP GitHub Serve Mode');
    expect(mainPayloadText).not.toContain('# Organizer Scheduler Mode');
    expect(mainPayloadText).not.toContain('# MCP Pipeline GitHub Issues Mode');
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

  it('asks summary clarification for issue report and runs default pipeline when user answers "нет"', async () => {
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
                '{"type":"mcp","method":"pipeline","value":"repo_issue_report","setting":{"owner":"openclaw","repo":"openclaw"}}',
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

    const store = createChatAgentStore();
    store.getState().setInputValue('сделай отчет по issue репозитория openclaw/openclaw');
    await store.getState().sendUserMessage();

    expect(fetchMock).not.toHaveBeenCalled();
    let assistantMessages = store
      .getState()
      .currentChat.messages.filter((message) => message.role === 'assistant');
    let assistantMessage = assistantMessages[assistantMessages.length - 1];
    expect(assistantMessage?.content).toContain('Нужна ли какая-то суммаризация по отчету');

    fetchMock
      .mockResolvedValueOnce({
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
                    issues: [{ id: 1, title: 'Bug #1' }],
                  }),
                },
              ],
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () =>
          JSON.stringify({
            result: {
              structuredContent: {
                downloadUrl: 'http://localhost:3001/downloads/openclaw_openclaw_issues.txt',
              },
            },
          }),
      });

    store.getState().setInputValue('нет');
    await store.getState().sendUserMessage();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [firstUrl, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(firstUrl).toBe('http://localhost:3001/mcp/github/tools/list_issues/invoke');
    expect(String(firstInit.body)).toContain('"owner":"openclaw"');
    expect(String(firstInit.body)).toContain('"repo":"openclaw"');

    const [secondUrl, secondInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(secondUrl).toBe('http://localhost:3001/mcp/file-tools/tools/save_text_to_file/invoke');
    expect(String(secondInit.body)).toContain('"fileName":"openclaw_openclaw_issues"');

    assistantMessages = store
      .getState()
      .currentChat.messages.filter((message) => message.role === 'assistant');
    assistantMessage = assistantMessages[assistantMessages.length - 1];

    expect(assistantMessage?.content).toContain('Отчет по issue сформирован.');
    expect(assistantMessage?.content).toContain('http://localhost:3001/downloads/openclaw_openclaw_issues.txt');
    expect(assistantMessage?.content).not.toContain('"type":"mcp"');
  });

  it('asks RAG clarification no more than three times when relevance is below threshold', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    getBalanceMock.mockResolvedValue(100);

    localStorage.setItem(
      'rag_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:5001',
        selectedIndexIds: ['idx-1'],
        minScore: 0.5,
        askClarificationOnLowRelevance: true,
      }),
    );

    fetchMock.mockImplementation(async (url: string) => {
      if (url === 'http://localhost:5001/rag/retrieve/multi') {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () =>
            JSON.stringify({
              indexIds: ['idx-1'],
              searchedIndexIds: ['idx-1'],
              missingIndexIds: [],
              matches: [
                {
                  indexId: 'idx-1',
                  score: 0.12,
                  text: 'low relevance',
                  metadata: {
                    source: 'local-file',
                    file: 'kb.md',
                    title: 'KB',
                    section: 'intro',
                    chunk_id: 'c1',
                    strategy: 'structured',
                    token_count: 10,
                  },
                },
              ],
            }),
        };
      }
      throw new Error(`Unexpected fetch url: ${url}`);
    });

    const store = createChatAgentStore();
    store.getState().setInputValue('первый вопрос');
    await store.getState().sendUserMessage();
    store.getState().setInputValue('второй вопрос');
    await store.getState().sendUserMessage();
    store.getState().setInputValue('третий вопрос');
    await store.getState().sendUserMessage();

    expect(createChatCompletionMock).toHaveBeenCalledTimes(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(store.getState().currentChat.ragClarificationAttempts).toBe(3);

    const assistantMessages = store.getState().currentChat.messages.filter((message) => message.role === 'assistant');
    expect(assistantMessages).toHaveLength(3);
    expect(assistantMessages[0]?.content).toContain('Не знаю');
    expect(assistantMessages[2]?.content).toContain('3/3');
  });

  it('falls back to standard LLM path after third RAG clarification request', async () => {
    const { createChatAgentStore } = await import('../src/processes/chat-agent/model/store');
    getBalanceMock.mockResolvedValue(100);

    localStorage.setItem(
      'rag_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:5001',
        selectedIndexIds: ['idx-1'],
        minScore: 0.5,
        askClarificationOnLowRelevance: true,
      }),
    );

    fetchMock.mockImplementation(async (url: string) => {
      if (url === 'http://localhost:5001/rag/retrieve/multi') {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () =>
            JSON.stringify({
              indexIds: ['idx-1'],
              searchedIndexIds: ['idx-1'],
              missingIndexIds: [],
              matches: [
                {
                  indexId: 'idx-1',
                  score: 0.12,
                  text: 'low relevance',
                  metadata: {
                    source: 'local-file',
                    file: 'kb.md',
                    title: 'KB',
                    section: 'intro',
                    chunk_id: 'c1',
                    strategy: 'structured',
                    token_count: 10,
                  },
                },
              ],
            }),
        };
      }
      throw new Error(`Unexpected fetch url: ${url}`);
    });

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
    store.getState().setInputValue('первый вопрос');
    await store.getState().sendUserMessage();
    store.getState().setInputValue('второй вопрос');
    await store.getState().sendUserMessage();
    store.getState().setInputValue('третий вопрос');
    await store.getState().sendUserMessage();
    store.getState().setInputValue('четвертый вопрос');
    await store.getState().sendUserMessage();

    expect(createChatCompletionMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(store.getState().currentChat.ragClarificationAttempts).toBe(3);

    const assistantMessages = store.getState().currentChat.messages.filter((message) => message.role === 'assistant');
    expect(assistantMessages).toHaveLength(4);
    expect(assistantMessages[3]?.content).toBe('ok');
  });
});
