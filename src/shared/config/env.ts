function parseIntegerEnv(rawValue: string | undefined, fallback: number): number {
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseBooleanEnv(rawValue: string | undefined, fallback: boolean): boolean {
  if (rawValue === undefined) {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }

  return fallback;
}

const proxyApiKey = import.meta.env.VITE_PROXYAPI_API_KEY as string | undefined;
const openAiApiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? proxyApiKey;
const openAiApiUrl =
  (import.meta.env.VITE_OPENAI_API_URL as string | undefined) ?? 'https://openai.api.proxyapi.ru/v1/chat/completions';
const proxyApiBalanceUrl =
  (import.meta.env.VITE_PROXYAPI_BALANCE_URL as string | undefined) ?? 'https://api.proxyapi.ru/proxyapi/balance';

const llmModelMain =
  (import.meta.env.VITE_LLM_MODEL_MAIN as string | undefined) ??
  (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ??
  'gpt-5.1';

const llmModelSummary = (import.meta.env.VITE_LLM_MODEL_SUMMARY as string | undefined) ?? undefined;
const summaryChunkSize = parseIntegerEnv(import.meta.env.VITE_SUMMARY_CHUNK_SIZE as string | undefined, 5);
const summaryKeepLast = parseIntegerEnv(import.meta.env.VITE_SUMMARY_KEEP_LAST as string | undefined, 5);
const summaryEnabledDefault = parseBooleanEnv(import.meta.env.VITE_SUMMARY_ENABLED_DEFAULT as string | undefined, false);
const summaryLanguage = (import.meta.env.VITE_SUMMARY_LANGUAGE as string | undefined) ?? 'ru';
const ragApiBaseUrl =
  (import.meta.env.VITE_RAG_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:5001';

export const env = {
  openAiApiKey,
  openAiApiUrl,
  proxyApiBalanceUrl,
  llmModelMain,
  llmModelSummary,
  summaryChunkSize,
  summaryKeepLast,
  summaryEnabledDefault,
  summaryLanguage,
  ragApiBaseUrl,
};
