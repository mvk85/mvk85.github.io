import { useCallback, useMemo, useState } from 'react';

import { buildChatCompletionPayload } from '@/entities/chat/lib/buildPayload';
import { LIMIT_REACHED_TEXT, USER_MESSAGE_LIMIT } from '@/entities/chat/lib/constants';
import { initializeChatMessages, loadChatMessages, resetChatMessages, saveChatMessages } from '@/entities/chat/lib/storage';
import type { ChatMessage } from '@/entities/chat/model/types';
import { openAiProxyChatApi } from '@/shared/api/openAiProxyChatApi';
import { normalizeError } from '@/shared/lib/errors';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

function extractAssistantText(response: { choices?: Array<{ message?: { content?: string | null } }> }): string {
  const text = response.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Сервер вернул пустой ответ модели.');
  }

  return text;
}

function countUserMessages(messages: ChatMessage[]): number {
  return messages.filter((message) => message.role === 'user').length;
}

export function useChat() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => initializeChatMessages());
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userMessageCount = useMemo(() => countUserMessages(messages), [messages]);
  const isLimitReached = userMessageCount >= USER_MESSAGE_LIMIT;

  const visibleMessages = useMemo(() => messages.filter((message) => message.role !== 'system'), [messages]);
  const limitNotice = isLimitReached ? LIMIT_REACHED_TEXT : null;

  const sendUserMessage = useCallback(async () => {
    const normalizedInput = inputValue.trim();

    if (!normalizedInput || status === 'loading' || isLimitReached) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: normalizedInput }];
    saveChatMessages(nextMessages);
    setMessages(nextMessages);
    setInputValue('');
    setStatus('loading');
    setErrorMessage(null);

    try {
      const historyFromStorage = loadChatMessages() ?? nextMessages;
      const payload = buildChatCompletionPayload(historyFromStorage);
      const response = await openAiProxyChatApi.createChatCompletion(payload);
      const assistantText = extractAssistantText(response);

      const freshHistory = loadChatMessages() ?? historyFromStorage;
      const assistantMessage: ChatMessage = { role: 'assistant', content: assistantText };
      const updatedMessages = [...freshHistory, assistantMessage];
      saveChatMessages(updatedMessages);
      setMessages(updatedMessages);
      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(normalizeError(error));
    }
  }, [inputValue, isLimitReached, messages, status]);

  const clearChat = useCallback(() => {
    const initialMessages = resetChatMessages();
    setMessages(initialMessages);
    setInputValue('');
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  return {
    clearChat,
    errorMessage,
    inputValue,
    isLimitReached,
    isLoading: status === 'loading',
    limitNotice,
    messages: visibleMessages,
    setInputValue,
    sendUserMessage,
    status,
    userMessageCount,
  };
}
