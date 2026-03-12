import { useEffect } from 'react';
import { useStore } from 'zustand';

import { getChatAgentDerived, getChatAgentStore } from '@/processes/chat-agent/model/store';

export function useChatAgent() {
  const chatAgentStore = getChatAgentStore();
  const state = useStore(chatAgentStore, (storeState) => storeState);
  const derived = getChatAgentDerived(state);

  useEffect(() => {
    if (state.statsState.previousBalance !== null) {
      return;
    }

    void state.refreshInitialBalance().catch(() => {
      console.warn('[chat-agent] initial balance refresh failed on mount');
    });
  }, [state.refreshInitialBalance, state.statsState.previousBalance]);

  return {
    ...derived,
    clearChat: state.clearChat,
    clearLongTermMemory: state.clearLongTermMemory,
    chatHistory: state.chatHistory,
    createBranchFromCurrentChat: state.createBranchFromCurrentChat,
    createNewChat: state.createNewChat,
    deleteScheduledEvent: state.deleteScheduledEvent,
    deleteHistoryChat: state.deleteHistoryChat,
    errorMessage: state.errorMessage,
    inputValue: state.inputValue,
    isLoading: state.status === 'loading',
    longTermMemory: state.longTermMemory,
    memoryErrorMessage: state.memoryErrorMessage,
    sendUserMessage: state.sendUserMessage,
    setCurrentChatProfile: state.setCurrentChatProfile,
    setCurrentChatModel: state.setCurrentChatModel,
    setCurrentChatStrategy: state.setCurrentChatStrategy,
    setCurrentChatTask: state.setCurrentChatTask,
    setCurrentTaskInvariantsEnabled: state.setCurrentTaskInvariantsEnabled,
    setInputValue: state.setInputValue,
    setStrategy1WindowSize: state.setStrategy1WindowSize,
    setStrategy2WindowSize: state.setStrategy2WindowSize,
    status: state.status,
    switchToHistoryChat: state.switchToHistoryChat,
  };
}
