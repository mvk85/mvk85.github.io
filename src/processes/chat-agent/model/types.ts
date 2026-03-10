import type { ChatSession, LongTermMemoryItem, WorkingMemory } from '@/entities/chat/model/types';

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
  statsState: ChatStatsState;
  workingMemoryByChat: Record<string, WorkingMemory>;
  longTermMemory: LongTermMemoryItem[];
  status: RequestStatus;
  errorMessage: string | null;
  memoryErrorMessage: string | null;
  hasChatsWithoutStrategy: boolean;
  activeRequestId: number | null;
};
