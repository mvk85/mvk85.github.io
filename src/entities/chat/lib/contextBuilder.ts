import type { ChatMessage, ChatSummaryState, LlmMessage } from '@/entities/chat/model/types';
import type { createSummaryService } from '@/entities/chat/lib/summaryService';

export type ContextBuilderMetrics = {
  rawChars: number;
  contextChars: number;
  compressedMessagesCount: number;
  coveredUntilMessageId: number | null;
};

export type BuildContextResult = {
  contextMessages: LlmMessage[];
  summaryState: ChatSummaryState;
  metrics: ContextBuilderMetrics;
};

type SummaryService = ReturnType<typeof createSummaryService>;

type BuildContextParams = {
  compressionEnabled: boolean;
  rawMessages: ChatMessage[];
  summaryState: ChatSummaryState;
  summaryKeepLast: number;
  summaryService: SummaryService;
};

function toLlmMessages(messages: ChatMessage[]): LlmMessage[] {
  return messages.map((message) => ({ role: message.role, content: message.content }));
}

function countChars(messages: LlmMessage[]): number {
  return messages.reduce((total, message) => total + message.content.length, 0);
}

function buildSummaryContextMessage(summaryText: string): LlmMessage {
  return {
    role: 'user',
    content: `Сводка истории диалога:\n${summaryText}`,
  };
}

function getUncoveredOldZoneMessages(messages: ChatMessage[], summaryKeepLast: number, coveredUntilMessageId: number | null): ChatMessage[] {
  const oldZoneEnd = Math.max(messages.length - summaryKeepLast, 0);
  const oldZoneMessages = messages.slice(0, oldZoneEnd);

  if (coveredUntilMessageId === null) {
    return oldZoneMessages;
  }

  return oldZoneMessages.filter((message) => message.id > coveredUntilMessageId);
}

export async function buildContext(params: BuildContextParams): Promise<BuildContextResult> {
  const fullRawContext = toLlmMessages(params.rawMessages);
  const rawChars = countChars(fullRawContext);

  if (!params.compressionEnabled) {
    return {
      contextMessages: fullRawContext,
      summaryState: params.summaryState,
      metrics: {
        rawChars,
        contextChars: rawChars,
        compressedMessagesCount: 0,
        coveredUntilMessageId: params.summaryState.coveredUntilMessageId,
      },
    };
  }

  if (params.rawMessages.length <= params.summaryKeepLast) {
    return {
      contextMessages: fullRawContext,
      summaryState: params.summaryState,
      metrics: {
        rawChars,
        contextChars: rawChars,
        compressedMessagesCount: 0,
        coveredUntilMessageId: params.summaryState.coveredUntilMessageId,
      },
    };
  }

  const summaryUpdateResult = await params.summaryService.updateSummaryIfNeeded(params.rawMessages, params.summaryState);
  const nextSummaryState = summaryUpdateResult.summaryState;

  const uncoveredOldZoneMessages = getUncoveredOldZoneMessages(
    params.rawMessages,
    params.summaryKeepLast,
    nextSummaryState.coveredUntilMessageId,
  );

  const lastMessages = params.rawMessages.slice(-params.summaryKeepLast);
  const contextMessages: LlmMessage[] = [];

  if (nextSummaryState.summaryText.trim().length > 0) {
    contextMessages.push(buildSummaryContextMessage(nextSummaryState.summaryText));
  }

  contextMessages.push(...toLlmMessages(uncoveredOldZoneMessages));
  contextMessages.push(...toLlmMessages(lastMessages));

  const contextChars = countChars(contextMessages);

  return {
    contextMessages,
    summaryState: nextSummaryState,
    metrics: {
      rawChars,
      contextChars,
      compressedMessagesCount: summaryUpdateResult.compressedMessagesCount,
      coveredUntilMessageId: nextSummaryState.coveredUntilMessageId,
    },
  };
}
