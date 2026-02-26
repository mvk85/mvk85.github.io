const proxyApiKey = import.meta.env.VITE_PROXYAPI_API_KEY as string | undefined;
const openAiApiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? proxyApiKey;
const openAiApiUrl =
  (import.meta.env.VITE_OPENAI_API_URL as string | undefined) ?? 'https://openai.api.proxyapi.ru/v1/chat/completions';
const openAiModel = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? 'gpt-4o';
const proxyApiBalanceUrl =
  (import.meta.env.VITE_PROXYAPI_BALANCE_URL as string | undefined) ?? 'https://api.proxyapi.ru/proxyapi/balance';

export const env = {
  openAiApiKey,
  openAiApiUrl,
  openAiModel,
  proxyApiBalanceUrl,
};
