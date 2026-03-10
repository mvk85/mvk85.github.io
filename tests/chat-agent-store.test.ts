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
  createChatCompletionMock.mockReset();
  getBalanceMock.mockReset();
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
});
