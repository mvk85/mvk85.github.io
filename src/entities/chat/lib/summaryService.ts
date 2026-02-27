import { buildChatCompletionPayload } from '@/entities/chat/lib/buildPayload';
import type { ChatMessage, ChatSummaryState } from '@/entities/chat/model/types';
import type { ChatCompletionResponse } from '@/entities/chat-response/model/types';

export type SummaryServiceConfig = {
  summaryChunkSize: number;
  summaryKeepLast: number;
  summaryLanguage: string;
  mainModel: string;
  summaryModel?: string;
  createChatCompletion: (payload: { model: string; messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> }) => Promise<
    ChatCompletionResponse
  >;
};

export type SummaryUpdateResult = {
  summaryState: ChatSummaryState;
  compressedMessagesCount: number;
};

function buildSummarySystemPrompt(language: string): string {
  if (language === 'ru') {
    return 'Ты модуль сжатия истории диалога. Пиши строго на русском. Верни только обновленное summary без пояснений.';
  }

  return `Ты модуль сжатия истории диалога. Пиши строго на языке: ${language}. Верни только обновленное summary без пояснений.`;
}

function buildSummaryUserPrompt(rollingSummary: string, batchOfMessages: ChatMessage[]): string {
  const batchLines = batchOfMessages.map((message) => `[${message.id}][${message.role}]: ${message.content}`).join('\n');

  return [
    'Текущее rolling summary:',
    rollingSummary.trim().length > 0 ? rollingSummary : '(пусто)',
    '',
    'Новый батч сообщений:',
    batchLines,
    '',
    'Сформируй обновленный summary строго в структуре:',
    'Контекст',
    'Цели',
    'Решения',
    'Ограничения',
    'Открытые вопросы',
  ].join('\n');
}

function extractSummaryText(response: ChatCompletionResponse): string {
  const content = response.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Модель суммаризации вернула пустой summary.');
  }

  return content;
}

function getEffectiveSummaryModel(config: SummaryServiceConfig): string {
  return config.summaryModel && config.summaryModel.trim().length > 0 ? config.summaryModel : config.mainModel;
}

function getCoverageStartIndex(oldZoneMessages: ChatMessage[], coveredUntilMessageId: number | null): number {
  if (coveredUntilMessageId === null) {
    return 0;
  }

  const firstUncoveredIndex = oldZoneMessages.findIndex((message) => message.id > coveredUntilMessageId);
  return firstUncoveredIndex === -1 ? oldZoneMessages.length : firstUncoveredIndex;
}

export function createSummaryService(config: SummaryServiceConfig) {
  const summaryModel = getEffectiveSummaryModel(config);

  async function summarizeBatch(rollingSummary: string, batchOfMessages: ChatMessage[]): Promise<string> {
    const payload = buildChatCompletionPayload(
      [
        {
          role: 'system',
          content: buildSummarySystemPrompt(config.summaryLanguage),
        },
        {
          role: 'user',
          content: buildSummaryUserPrompt(rollingSummary, batchOfMessages),
        },
      ],
      summaryModel,
    );

    const response = await config.createChatCompletion(payload);
    return extractSummaryText(response);
  }

  async function updateSummaryIfNeeded(messages: ChatMessage[], summaryState: ChatSummaryState): Promise<SummaryUpdateResult> {
    const oldZoneEnd = Math.max(messages.length - config.summaryKeepLast, 0);
    const oldZoneMessages = messages.slice(0, oldZoneEnd);
    const coverageStartIndex = getCoverageStartIndex(oldZoneMessages, summaryState.coveredUntilMessageId);

    let uncoveredMessages = oldZoneMessages.slice(coverageStartIndex);
    let rollingSummary = summaryState.summaryText;
    let coveredUntilMessageId = summaryState.coveredUntilMessageId;
    let compressedMessagesCount = 0;

    while (uncoveredMessages.length >= config.summaryChunkSize) {
      const batchOfMessages = uncoveredMessages.slice(0, config.summaryChunkSize);
      rollingSummary = await summarizeBatch(rollingSummary, batchOfMessages);
      coveredUntilMessageId = batchOfMessages[batchOfMessages.length - 1].id;
      compressedMessagesCount += batchOfMessages.length;
      uncoveredMessages = uncoveredMessages.slice(config.summaryChunkSize);
    }

    if (compressedMessagesCount === 0) {
      return {
        summaryState,
        compressedMessagesCount,
      };
    }

    return {
      compressedMessagesCount,
      summaryState: {
        summaryText: rollingSummary,
        coveredUntilMessageId,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  return {
    summaryModel,
    summarizeBatch,
    updateSummaryIfNeeded,
  };
}
