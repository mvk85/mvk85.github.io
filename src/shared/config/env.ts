const proxyApiKey = import.meta.env.VITE_PROXYAPI_API_KEY as string | undefined;
const openAiApiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? proxyApiKey;
const openAiApiUrl =
  (import.meta.env.VITE_OPENAI_API_URL as string | undefined) ?? 'https://openai.api.proxyapi.ru/v1/chat/completions';

export const env = {
  openAiApiKey,
  openAiApiUrl,
};
