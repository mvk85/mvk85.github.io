import type { ChatSession, LongTermMemoryItem, WorkingMemory } from '@/entities/chat/model/types';
import type { ScheduledEvent, SchedulerWizardState } from '@/processes/chat-agent/model/schedulerTypes';

export type PendingIssueReportSummaryState = {
  owner: string;
  repo: string;
};

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export type ChatStatsPerChat = {
  model: string | null;
  totalCost: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type ChatStatsState = {
  previousBalance: number | null;
  byChat: Record<string, ChatStatsPerChat>;
};

export type ChatAgentState = {
  inputValue: string;
  currentChat: ChatSession;
  chatHistory: ChatSession[];
  scheduledEvents: ScheduledEvent[];
  schedulerWizard: SchedulerWizardState | null;
  pendingIssueReportSummaryByChat: Record<string, PendingIssueReportSummaryState>;
  statsState: ChatStatsState;
  workingMemoryByChat: Record<string, WorkingMemory>;
  longTermMemory: LongTermMemoryItem[];
  status: RequestStatus;
  errorMessage: string | null;
  memoryErrorMessage: string | null;
  ragWarningMessage: string | null;
  hasChatsWithoutStrategy: boolean;
  activeRequestId: number | null;
  showThinkingLoader: boolean;
};
