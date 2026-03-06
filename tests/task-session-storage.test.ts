import { beforeEach, describe, expect, it } from 'vitest';

import { CHAT_SESSIONS_STORAGE_KEY } from '../src/entities/chat/lib/constants';
import { createFrontendPromptInitialTaskState } from '../src/entities/chat/lib/taskConfig';
import { loadChatSessionsStateWithDiagnostics } from '../src/entities/chat/lib/sessionStorage';

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

describe('task session storage', () => {
  it('восстанавливает taskState для выбранной задачи после перезапуска', () => {
    const taskState = createFrontendPromptInitialTaskState('2026-03-01T00:00:00.000Z');
    taskState.stage = 'validation';
    taskState.lastGeneratedPrompt = 'Prompt v1';
    taskState.invariantsEnabled = true;
    taskState.invariantViolation = {
      invariantId: 'frontend_rest_only',
      questionId: 'q4',
      questionText: 'Какие требования к API-интеграции (REST, auth, обработка ошибок, retries)?',
      ruleText: 'Допускается только REST. GraphQL и любая другая система интеграции API запрещены.',
    };

    localStorage.setItem(
      CHAT_SESSIONS_STORAGE_KEY,
      JSON.stringify({
        currentChat: {
          id: 'chat-task',
          createdAt: '2026-03-01T00:00:00.000Z',
          taskId: 'frontend_app_prompt',
          taskState,
          contextStrategy: 'strategy-1',
          strategySettings: { strategy1WindowSize: 10, strategy2WindowSize: 10, strategy2Facts: {} },
          messages: [{ id: 1, role: 'assistant', content: 'test' }],
          summaryState: { summaryText: '', coveredUntilMessageId: null, updatedAt: null },
        },
        chatHistory: [],
      }),
    );

    const loaded = loadChatSessionsStateWithDiagnostics();
    expect(loaded.state?.currentChat.taskId).toBe('frontend_app_prompt');
    expect(loaded.state?.currentChat.taskState?.stage).toBe('validation');
    expect(loaded.state?.currentChat.taskState?.lastGeneratedPrompt).toBe('Prompt v1');
    expect(loaded.state?.currentChat.taskState?.invariantsEnabled).toBe(true);
    expect(loaded.state?.currentChat.taskState?.invariantViolation?.questionId).toBe('q4');
  });

  it('для чатов без taskId применяет режим none', () => {
    localStorage.setItem(
      CHAT_SESSIONS_STORAGE_KEY,
      JSON.stringify({
        currentChat: {
          id: 'chat-legacy',
          createdAt: '2026-03-01T00:00:00.000Z',
          contextStrategy: 'strategy-1',
          strategySettings: { strategy1WindowSize: 10, strategy2WindowSize: 10, strategy2Facts: {} },
          messages: [],
          summaryState: { summaryText: '', coveredUntilMessageId: null, updatedAt: null },
        },
        chatHistory: [],
      }),
    );

    const loaded = loadChatSessionsStateWithDiagnostics();
    expect(loaded.state?.currentChat.taskId).toBe('none');
    expect(loaded.state?.currentChat.taskState).toBeNull();
  });
});
