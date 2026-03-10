import { loadChatStats } from '@/processes/chat-agent/lib/chatStatsStorage';
import { useChatAgent } from '@/processes/chat-agent/model/useChatAgent';

export { loadChatStats };

export function useChat() {
  return useChatAgent();
}
