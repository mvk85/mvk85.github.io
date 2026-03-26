import { beforeEach, describe, expect, it, vi } from 'vitest';

const openAiCreateMock = vi.fn();
const openAiBalanceMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('../src/shared/api/openAiProxyChatApi', () => ({
  openAiProxyChatApi: {
    createChatCompletion: (...args: unknown[]) => openAiCreateMock(...args),
    getBalance: (...args: unknown[]) => openAiBalanceMock(...args),
  },
}));

beforeEach(() => {
  openAiCreateMock.mockReset();
  openAiBalanceMock.mockReset();
  fetchMock.mockReset();
  Object.defineProperty(globalThis, 'fetch', {
    value: fetchMock,
    configurable: true,
  });
});

describe('llmApi', () => {
  it('routes qwen2.5 model to ollama /api/generate without auth header', async () => {
    const { llmApi } = await import('../src/shared/api/llmApi');

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () =>
        JSON.stringify({
          model: 'qwen2.5:0.5b',
          created_at: '2026-03-24T18:17:44.572706132Z',
          response: 'Hello! How can I assist you today?',
          done: true,
          done_reason: 'stop',
          prompt_eval_count: 33,
          eval_count: 10,
        }),
    });

    const response = await llmApi.createChatCompletion({
      model: 'qwen2.5:0.5b',
      messages: [{ role: 'user', content: 'Привет!' }],
      temperature: 0.4,
      num_predict: 128,
      num_ctx: 2048,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/api/generate');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
    expect(init.headers).not.toHaveProperty('Authorization');
    expect(String(init.body)).toContain('"stream":false');
    expect(String(init.body)).toContain('"temperature":0.4');
    expect(String(init.body)).toContain('"num_predict":128');
    expect(String(init.body)).toContain('"num_ctx":2048');

    expect(response.model).toBe('qwen2.5:0.5b');
    expect(response.choices[0]?.message.content).toBe('Hello! How can I assist you today?');
    expect(response.usage).toEqual({
      prompt_tokens: 33,
      completion_tokens: 10,
      total_tokens: 43,
    });
  });

  it('routes non-ollama models to openAiProxyChatApi', async () => {
    const { llmApi } = await import('../src/shared/api/llmApi');

    openAiCreateMock.mockResolvedValue({
      id: 'cloud-1',
      created: 1,
      model: 'gpt-5.1',
      object: 'chat.completion',
      choices: [{ finish_reason: 'stop', index: 0, message: { role: 'assistant', content: 'ok' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });

    const response = await llmApi.createChatCompletion({
      model: 'gpt-5.1',
      messages: [{ role: 'user', content: 'hello' }],
    });

    expect(openAiCreateMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.model).toBe('gpt-5.1');
  });
});
