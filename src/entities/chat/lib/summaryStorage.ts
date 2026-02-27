import { CHAT_SUMMARY_STORAGE_KEY } from '@/entities/chat/lib/constants';
import type { ChatSummaryState } from '@/entities/chat/model/types';

function isChatSummaryState(value: unknown): value is ChatSummaryState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ChatSummaryState>;

  return (
    typeof candidate.summaryText === 'string' &&
    (candidate.coveredUntilMessageId === null ||
      (typeof candidate.coveredUntilMessageId === 'number' &&
        Number.isInteger(candidate.coveredUntilMessageId) &&
        candidate.coveredUntilMessageId > 0)) &&
    (candidate.updatedAt === null || typeof candidate.updatedAt === 'string')
  );
}

export function createEmptySummaryState(): ChatSummaryState {
  return {
    summaryText: '',
    coveredUntilMessageId: null,
    updatedAt: null,
  };
}

export function saveChatSummaryState(summaryState: ChatSummaryState): void {
  localStorage.setItem(CHAT_SUMMARY_STORAGE_KEY, JSON.stringify(summaryState));
}

export function loadChatSummaryState(): ChatSummaryState | null {
  const raw = localStorage.getItem(CHAT_SUMMARY_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isChatSummaryState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function initializeChatSummaryState(): ChatSummaryState {
  const savedSummaryState = loadChatSummaryState();
  if (savedSummaryState) {
    return savedSummaryState;
  }

  const initialSummaryState = createEmptySummaryState();
  saveChatSummaryState(initialSummaryState);
  return initialSummaryState;
}

export function resetChatSummaryState(): ChatSummaryState {
  localStorage.removeItem(CHAT_SUMMARY_STORAGE_KEY);
  const emptySummaryState = createEmptySummaryState();
  saveChatSummaryState(emptySummaryState);
  return emptySummaryState;
}
