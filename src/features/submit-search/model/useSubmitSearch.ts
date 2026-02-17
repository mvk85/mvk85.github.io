import { useCallback, useState } from 'react';

import { chatApi } from '@/shared/api/chatApi';
import { mapChatResponseToText } from '@/entities/chat-response/lib/mapResponse';
import { normalizeError } from '@/shared/lib/errors';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

function sanitizeTelegramLogin(value: string): string {
  return value.trim().replace(/^@/, '');
}

function isTelegramLoginValid(value: string): boolean {
  const login = sanitizeTelegramLogin(value);
  return /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(login);
}

export function useSubmitSearch() {
  const [login, setLogin] = useState('');
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [resultText, setResultText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    if (!isTelegramLoginValid(login)) {
      setStatus('error');
      setResultText(null);
      setErrorMessage('Введите корректный Telegram login (от 4 до 32 символов).');
      return;
    }

    const normalizedLogin = sanitizeTelegramLogin(login);

    try {
      setStatus('loading');
      setResultText(null);
      setErrorMessage(null);

      const response = await chatApi.createCompletion({
        userMessage: `Найди информацию по telegram login: @${normalizedLogin}`,
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
