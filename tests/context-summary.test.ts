import { describe, expect, it, vi } from 'vitest';

import { buildContext } from '../src/entities/chat/lib/contextBuilder';
import { createSummaryService } from '../src/entities/chat/lib/summaryService';
import type { ChatMessage, ChatSummaryState } from '../src/entities/chat/model/types';

function createMessage(id: number): ChatMessage {
  return {
    id,
    role: id % 2 === 0 ? 'assistant' : 'user',
    content: `message-${id}`,
  };
}

function createMessages(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => createMessage(index + 1));
}

function createSummaryState(overrides: Partial<ChatSummaryState> = {}): ChatSummaryState {
  return {
    summaryText: '',
    coveredUntilMessageId: null,
    updatedAt: null,
    ...overrides,
  };
}

describe('ContextBuilder + SummaryService', () => {
  it('Compression OFF: отправляется полная raw-история', async () => {
    const messages = createMessages(8);
    const summaryService = createSummaryService({
      summaryChunkSize: 5,
      summaryKeepLast: 5,
      summaryLanguage: 'ru',
      mainModel: 'main-model',
      createChatCompletion: vi.fn(),
    });

    const result = await buildContext({
      compressionEnabled: false,
      rawMessages: messages,
      summaryState: createSummaryState(),
      summaryKeepLast: 5,
      summaryService,
    });

    expect(result.contextMessages).toHaveLength(8);
    expect(result.metrics.compressedMessagesCount).toBe(0);
  });

  it('Compression ON и сообщений <=5: summary не используется', async () => {
    const messages = createMessages(5);
    const summaryService = createSummaryService({
      summaryChunkSize: 5,
      summaryKeepLast: 5,
      summaryLanguage: 'ru',
      mainModel: 'main-model',
      createChatCompletion: vi.fn(),
    });

    const result = await buildContext({
      compressionEnabled: true,
      rawMessages: messages,
      summaryState: createSummaryState(),
      summaryKeepLast: 5,
      summaryService,
    });

    expect(result.contextMessages).toEqual(messages.map((message) => ({ role: message.role, content: message.content })));
    expect(result.metrics.compressedMessagesCount).toBe(0);
  });

  it('Compression ON и сообщений >5: старые уходят в summary, последние 5 остаются raw', async () => {
    const messages = createMessages(10);
    const createChatCompletion = vi.fn().mockResolvedValue({
      id: 'summary-1',
      created: Date.now(),
      model: 'summary-model',
      object: 'chat.completion',
      choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'SUMMARY-TEXT' } }],
    });

    const summaryService = createSummaryService({
      summaryChunkSize: 5,
      summaryKeepLast: 5,
      summaryLanguage: 'ru',
      mainModel: 'main-model',
      summaryModel: 'summary-model',
      createChatCompletion,
    });

    const result = await buildContext({
      compressionEnabled: true,
      rawMessages: messages,
      summaryState: createSummaryState(),
      summaryKeepLast: 5,
      summaryService,
    });

    expect(result.contextMessages[0]).toEqual({ role: 'user', content: 'Сводка истории диалога:\nSUMMARY-TEXT' });
    expect(result.contextMessages.slice(1)).toEqual(
      messages.slice(5).map((message) => ({ role: message.role, content: message.content })),
    );
    expect(result.summaryState.coveredUntilMessageId).toBe(5);
  });

  it('Инкрементальность: summary обновляется батчами ровно по 5', async () => {
    const messages = createMessages(16);
    const createChatCompletion = vi
      .fn()
      .mockResolvedValueOnce({
        id: 'summary-1',
        created: Date.now(),
        model: 'summary-model',
        object: 'chat.completion',
        choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'S1' } }],
      })
      .mockResolvedValueOnce({
        id: 'summary-2',
        created: Date.now(),
        model: 'summary-model',
        object: 'chat.completion',
        choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'S2' } }],
      });

    const summaryService = createSummaryService({
      summaryChunkSize: 5,
      summaryKeepLast: 5,
      summaryLanguage: 'ru',
      mainModel: 'main-model',
      summaryModel: 'summary-model',
      createChatCompletion,
    });

    const updateResult = await summaryService.updateSummaryIfNeeded(messages, createSummaryState());

    expect(createChatCompletion).toHaveBeenCalledTimes(2);
    expect(updateResult.compressedMessagesCount).toBe(10);
    expect(updateResult.summaryState.coveredUntilMessageId).toBe(10);
  });

  it('Fallback модели: если summary model пустая, используется main model', async () => {
    const createChatCompletion = vi.fn().mockResolvedValue({
      id: 'summary-1',
      created: Date.now(),
      model: 'main-model',
      object: 'chat.completion',
      choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'SUMMARY' } }],
    });

    const summaryService = createSummaryService({
      summaryChunkSize: 5,
      summaryKeepLast: 5,
      summaryLanguage: 'ru',
      mainModel: 'main-model',
      summaryModel: '',
      createChatCompletion,
    });

    await summaryService.summarizeBatch('', createMessages(5));

    const [firstCallPayload] = createChatCompletion.mock.calls[0];
    expect(firstCallPayload.model).toBe('main-model');
  });

  it('Summary язык: system prompt формируется на русском', async () => {
    const createChatCompletion = vi.fn().mockResolvedValue({
      id: 'summary-1',
      created: Date.now(),
      model: 'summary-model',
      object: 'chat.completion',
      choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'SUMMARY' } }],
    });

    const summaryService = createSummaryService({
      summaryChunkSize: 5,
      summaryKeepLast: 5,
      summaryLanguage: 'ru',
      mainModel: 'main-model',
      summaryModel: 'summary-model',
      createChatCompletion,
    });

    await summaryService.summarizeBatch('', createMessages(5));

    const [firstCallPayload] = createChatCompletion.mock.calls[0];
    expect(firstCallPayload.messages[0].content).toContain('Пиши строго на русском');
  });
});
