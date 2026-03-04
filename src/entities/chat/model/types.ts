import type { UserProfileId } from '@/entities/profile/model/types';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessage = {
  id: number;
  role: ChatMessageRole;
  content: string;
};

export type LlmMessageRole = 'system' | 'user' | 'assistant';

export type LlmMessage = {
  role: LlmMessageRole;
  content: string;
};

export type ChatCompletionPayload = {
  model: string;
  messages: LlmMessage[];
};

export type ChatSummaryState = {
  summaryText: string;
  coveredUntilMessageId: number | null;
  updatedAt: string | null;
};

export type ChatContextStrategy = 'strategy-1' | 'strategy-2' | 'strategy-3';

export type Strategy2Facts = Record<string, string>;

export type WorkingMemoryTaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export type WorkingMemoryTask = {
  id: string;
  title: string;
  status: WorkingMemoryTaskStatus;
  notes?: string;
};

export type WorkingMemory = {
  goal: string | null;
  tasks: WorkingMemoryTask[];
  current_focus: string | null;
  constraints: string[];
  updated_at: string;
};

export type LongTermMemoryKind = 'profile' | 'preference' | 'knowledge' | 'decision';

export type LongTermMemoryItem = {
  id: string;
  kind: LongTermMemoryKind;
  text: string;
  confidence: number;
  updated_at: string;
};

export type ChatStrategySettings = {
  strategy1WindowSize: number;
  strategy2WindowSize: number;
  strategy2Facts: Strategy2Facts;
};

export type ChatSession = {
  id: string;
  createdAt: string;
  parentChatId: string | null;
  profileId: UserProfileId;
  messages: ChatMessage[];
  summaryState: ChatSummaryState;
  contextStrategy: ChatContextStrategy;
  strategySettings: ChatStrategySettings;
  title?: string;
};

export type ChatSessionsState = {
  currentChat: ChatSession;
  chatHistory: ChatSession[];
};
