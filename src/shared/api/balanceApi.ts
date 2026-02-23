import { getJson } from '@/shared/api/client';
import { env } from '@/shared/config/env';

const BALANCE_MIN_INTERVAL_MS = 2000;
let lastBalanceRequestStartedAtMs = 0;
let balanceRequestChain: Promise<unknown> = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureBalanceRequestInterval(): Promise<void> {
  const now = Date.now();
  const waitMs = lastBalanceRequestStartedAtMs + BALANCE_MIN_INTERVAL_MS - now;
  if (waitMs > 0) {
    await sleep(waitMs);
  }

  lastBalanceRequestStartedAtMs = Date.now();
}

function parseBalance(payload: unknown): number {
  if (typeof payload === 'number') {
    return payload;
  }

  if (typeof payload === 'string') {
    const parsed = Number(payload);
    if (Number.isFinite(parsed)) return parsed;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates: Array<unknown> = [
      record.balance,
      record.rub,
      record.balance_rub,
      record.balanceRub,
      (record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>).balance : undefined),
    ];

    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
  }

  throw new Error('Сервер вернул баланс в неизвестном формате.');
}

export async function fetchBalanceRub(): Promise<number> {
  if (!env.balanceApiKey) {
    throw new Error('Не задан VITE_PROXYAPI_API_KEY в .env (или VITE_OPENAI_API_KEY).');
  }

  const requestPromise = balanceRequestChain.then(async () => {
    await ensureBalanceRequestInterval();

    const payload = await getJson<unknown>(env.balanceApiUrl, {
      Authorization: `Bearer ${env.balanceApiKey}`,
    });

    return parseBalance(payload);
  });

  balanceRequestChain = requestPromise.catch(() => undefined);

  return requestPromise;
}

export async function pollBalanceChangeRub(
  previousBalance: number,
  { delayMs = 2000, maxAttempts = 5 }: { delayMs?: number; maxAttempts?: number } = {},
): Promise<number> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await sleep(delayMs);
    const next = await fetchBalanceRub();

    if (Math.abs(next - previousBalance) > 1e-9) {
      return next;
    }
  }

  throw new Error('Невозможно получить обновлённый баланс (после 5 попыток).');
}
