import { useCallback, useMemo, useState } from 'react';

import type { ChatCompletionResponse } from '@/entities/chat-response/model/types';
import { fetchBalanceRub, pollBalanceChangeRub } from '@/shared/api/balanceApi';
import { openAiProxyChatApi } from '@/shared/api/openAiProxyChatApi';
import { normalizeError } from '@/shared/lib/errors';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

const MODELS = ['gpt-3.5-turbo', 'gpt-4o', 'gpt-5.2'] as const;

export type ComparisonRow = {
  model: (typeof MODELS)[number];
  costRub: number;
  responseTimeSec: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  responseText: string;
};

function extractResponseText(response: ChatCompletionResponse): string {
  const text = response.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Сервер вернул пустой ответ модели.');
  }
  return text;
}

function extractUsageOrThrow(response: ChatCompletionResponse): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  const usage = response.usage;

  if (
    !usage ||
    typeof usage.prompt_tokens !== 'number' ||
    typeof usage.completion_tokens !== 'number' ||
    typeof usage.total_tokens !== 'number'
  ) {
    throw new Error('Сервер не вернул usage (prompt_tokens/completion_tokens/total_tokens).');
  }

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}

export function useCompareModels() {
  const defaultBody = useMemo(
    () => '',
    [],
  );

  const [promptText, setPromptText] = useState<string>(defaultBody);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [initialBalanceRub, setInitialBalanceRub] = useState<number | null>(null);
  const [rows, setRows] = useState<ComparisonRow[]>([]);

  const run = useCallback(async () => {
    if (status === 'loading') {
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    setProgressMessage('Получаем текущий баланс...');
    setRows([]);
    setInitialBalanceRub(null);

    try {
      const trimmedPrompt = promptText.trim();
      if (trimmedPrompt.length < 6) {
        throw new Error('Введите текст запроса (минимум 6 символов).');
      }

      const startBalance = await fetchBalanceRub();
      setInitialBalanceRub(startBalance);

      let currentBalance = startBalance;
      const nextRows: ComparisonRow[] = [];

      for (const model of MODELS) {
        const beforeBalance = currentBalance;

        setProgressMessage(`Запрос к модели ${model}...`);

        const requestPayload = {
          model,
          messages: [
            {
              role: 'user',
              content: trimmedPrompt,
            },
          ],
        };

        const start = performance.now();
        const response = await openAiProxyChatApi.createChatCompletion(requestPayload);
        const end = performance.now();

        const responseText = extractResponseText(response);
        const usage = extractUsageOrThrow(response);

        setProgressMessage(`Ожидаем обновления баланса после запроса к ${model}...`);
        const newBalance = await pollBalanceChangeRub(beforeBalance, { delayMs: 2000, maxAttempts: 5 });

        const costRub = beforeBalance - newBalance;
        currentBalance = newBalance;

        nextRows.push({
          model,
          costRub,
          responseTimeSec: (end - start) / 1000,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          responseText,
        });
      }

      setRows(nextRows);
      setStatus('success');
      setProgressMessage(null);
    } catch (error: unknown) {
      setStatus('error');
      setProgressMessage(null);
      setErrorMessage(normalizeError(error));
    }
  }, [promptText, status]);

  return {
    promptText,
    setPromptText,
    status,
    errorMessage,
    progressMessage,
    initialBalanceRub,
    rows,
    run,
  };
}
