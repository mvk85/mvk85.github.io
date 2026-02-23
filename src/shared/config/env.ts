const proxyApiKey = import.meta.env.VITE_PROXYAPI_API_KEY as string | undefined;
const openAiApiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? proxyApiKey;
const openAiApiUrl =
  (import.meta.env.VITE_OPENAI_API_URL as string | undefined) ?? 'https://openai.api.proxyapi.ru/v1/chat/completions';
const model = import.meta.env.VITE_OPENAI_MODEL as string | undefined;
const balanceApiUrl =
  (import.meta.env.VITE_PROXYAPI_BALANCE_URL as string | undefined) ?? 'https://api.proxyapi.ru/proxyapi/balance';
const balanceApiKey = proxyApiKey ?? openAiApiKey;

export const env = {
  openAiApiKey,
  openAiApiUrl,
  model,
  balanceApiUrl,
  balanceApiKey,
};
