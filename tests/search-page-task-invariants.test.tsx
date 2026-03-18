import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const useChatMock = vi.fn();

vi.mock('../src/features/chat/model/useChat', () => ({
  useChat: () => useChatMock(),
}));

vi.mock('../src/shared/ui/PageContainer', () => ({
  PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../src/entities/chat-response/ui/MarkdownMessage', () => ({
  MarkdownMessage: ({ content }: { content: string }) => <div>{content}</div>,
}));

import { SearchPage } from '../src/pages/search-page/ui/SearchPage';

function createUseChatResult(taskId: 'none' | 'frontend_app_prompt', invariantsEnabled: boolean) {
  return {
    canCreateBranchFromCurrentChat: false,
    chatHistory: [],
    createBranchFromCurrentChat: vi.fn(),
    createNewChat: vi.fn(),
    currentChatStrategy: 'strategy-1' as const,
    currentChatProfile: 'default',
    currentChatTask: taskId,
    currentTaskInvariantsEnabled: invariantsEnabled,
    currentStrategy1WindowSize: 10,
    currentStrategy2WindowSize: 10,
    currentChatId: 'chat-1',
    deleteScheduledEvent: vi.fn(),
    deleteHistoryChat: vi.fn(),
    errorMessage: null,
    inputValue: '',
    isLimitReached: false,
    isLoading: false,
    showThinkingLoader: true,
    limitNotice: null,
    messages: [],
    model: 'test-model',
    promptTokens: 0,
    completionTokens: 0,
    clearLongTermMemory: vi.fn(),
    totalTokens: 0,
    longTermMemory: [],
    memoryErrorMessage: null,
    ragWarningMessage: null,
    sendUserMessage: vi.fn(),
    scheduledEvents: [],
    setCurrentChatStrategy: vi.fn(),
    setCurrentChatProfile: vi.fn(),
    setCurrentChatModel: vi.fn(),
    setCurrentChatTask: vi.fn(),
    setCurrentTaskInvariantsEnabled: vi.fn(),
    setStrategy1WindowSize: vi.fn(),
    setStrategy2WindowSize: vi.fn(),
    setInputValue: vi.fn(),
    switchToHistoryChat: vi.fn(),
    totalCost: 0,
    userMessageCount: 0,
    workingMemory: null,
  };
}

describe('SearchPage task invariants', () => {
  it('показывает блок инвариантов для задачи frontend_app_prompt', () => {
    useChatMock.mockReturnValue(createUseChatResult('frontend_app_prompt', true));

    const markup = renderToStaticMarkup(<SearchPage />);

    expect(markup).toContain('Инварианты задачи');
    expect(markup).toContain('Включить инварианты');
    expect(markup).toContain('Допускается только REST');
  });

  it('не показывает блок инвариантов, если задача не выбрана', () => {
    useChatMock.mockReturnValue(createUseChatResult('none', false));

    const markup = renderToStaticMarkup(<SearchPage />);

    expect(markup).not.toContain('Инварианты задачи');
    expect(markup).not.toContain('Включить инварианты');
  });

  it('показывает UI-состояния загрузки и лимита сообщений', () => {
    useChatMock.mockReturnValue({
      ...createUseChatResult('none', false),
      isLoading: true,
      isLimitReached: true,
      limitNotice: 'Лимит сообщений достигнут',
    });

    const markup = renderToStaticMarkup(<SearchPage />);

    expect(markup).toContain('Думаю над ответом...');
    expect(markup).toContain('Лимит сообщений достигнут');
  });
});
