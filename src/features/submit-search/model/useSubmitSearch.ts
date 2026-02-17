import { useCallback, useEffect, useRef, useState } from 'react';

import { chatApi, type ConversationMessage, type ScenarioReply } from '@/shared/api/chatApi';
import { normalizeError } from '@/shared/lib/errors';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export enum Step {
  ASK_AGE = 'ASK_AGE',
  ASK_LICENSE = 'ASK_LICENSE',
  DONE = 'DONE',
}

export type ChatUiMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const LICENSE_QUESTION = 'У вас есть водительское удостоверение категории В?';
const END_DIALOG_MESSAGE = 'Конец диалога.';

function createMessage(role: ChatUiMessage['role'], content: string): ChatUiMessage {
  return {
    id: `${Date.now()}-${Math.random()}`,
    role,
    content,
  };
}

function appendDialogFinishedMessage(messages: ChatUiMessage[]): ChatUiMessage[] {
  const lastMessage = messages[messages.length - 1];

  if (lastMessage?.role === 'system' && lastMessage.content === END_DIALOG_MESSAGE) {
    return messages;
  }

  return [...messages, createMessage('system', END_DIALOG_MESSAGE)];
}

function resolveNextStep(reply: ScenarioReply): Step {
  if (reply.kind === 'final') {
    return Step.DONE;
  }

  if (reply.text.trim() === LICENSE_QUESTION) {
    return Step.ASK_LICENSE;
  }

  return Step.ASK_AGE;
}

function toApiMessages(messages: ChatUiMessage[]): ConversationMessage[] {
  return messages.flatMap((message) => {
    if (message.role !== 'user' && message.role !== 'assistant') {
      return [];
    }

    return [{ role: message.role, content: message.content }];
  });
}

export function useSubmitSearch() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(Step.ASK_AGE);
  const [finished, setFinished] = useState(false);

  const hasStartedRef = useRef(false);

  const requestAssistantReply = useCallback(async (history: ConversationMessage[]) => {
    return chatApi.createCompletion({ messages: history });
  }, []);

  const applyAssistantReply = useCallback((reply: ScenarioReply) => {
    setMessages((prevMessages) => {
      const withAssistant = [...prevMessages, createMessage('assistant', reply.text)];

      if (reply.kind === 'final') {
        return appendDialogFinishedMessage(withAssistant);
      }

      return withAssistant;
    });

    const nextStep = resolveNextStep(reply);
    setStep(nextStep);
    setFinished(nextStep === Step.DONE);
  }, []);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const normalized = text.trim();

      if (!normalized || finished || status === 'loading') {
        return;
      }

      const userMessage = createMessage('user', normalized);
      const updatedMessages = [...messages, userMessage];

      setMessages(updatedMessages);
      setInputValue('');
      setStatus('loading');
      setErrorMessage(null);

      try {
        const reply = await requestAssistantReply(toApiMessages(updatedMessages));
        applyAssistantReply(reply);
        setStatus('success');
      } catch (error: unknown) {
        setStatus('error');
        setErrorMessage(normalizeError(error));
      }
    },
    [applyAssistantReply, finished, messages, requestAssistantReply, status],
  );

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const run = async () => {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const reply = await requestAssistantReply([]);
        applyAssistantReply(reply);
        setStatus('success');
      } catch (error: unknown) {
        setStatus('error');
        setErrorMessage(normalizeError(error));
      }
    };

    void run();
  }, [applyAssistantReply, requestAssistantReply]);

  return {
    inputValue,
    setInputValue,
    messages,
    status,
    errorMessage,
    step,
    finished,
    sendUserMessage,
  };
}
