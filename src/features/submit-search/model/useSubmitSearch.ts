import { useCallback, useState } from 'react';

import { chatApi } from '@/shared/api/chatApi';
import { mapChatResponseToText } from '@/entities/chat-response/lib/mapResponse';
import { normalizeError } from '@/shared/lib/errors';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

function sanitizeWord(value: string): string {
  return value.trim();
}

function isSingleWordValid(value: string): boolean {
  const word = sanitizeWord(value);
  return word.length > 0 && !/\s/.test(word);
}

export function useSubmitSearch() {
  const [login, setLogin] = useState('');
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [resultText, setResultText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    if (!isSingleWordValid(login)) {
      setStatus('error');
      setResultText(null);
      setErrorMessage('Введите одно слово без пробелов.');
      return;
    }

    const normalizedWord = sanitizeWord(login);

    try {
      setStatus('loading');
      setResultText(null);
      setErrorMessage(null);

      const response = await chatApi.createCompletion({
        userMessage: `Найди 5 синонимов для слова ${normalizedWord}. Ответ возвращай в виде списка обычным текстом`,
      });

      const text = mapChatResponseToText(response);
      setResultText(text);
      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      setResultText(null);
      setErrorMessage(normalizeError(error));
    }
  }, [login]);

  return {
    login,
    setLogin,
    status,
    resultText,
    errorMessage,
    onSubmit,
  };
}
