const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const apiUrl = import.meta.env.VITE_OPENAI_API_URL as string | undefined;
const model = import.meta.env.VITE_OPENAI_MODEL as string | undefined;

if (!apiKey) {
  throw new Error('Не задан VITE_OPENAI_API_KEY в .env');
}

if (!apiUrl) {
  throw new Error('Не задан VITE_OPENAI_API_URL в .env');
}

if (!model) {
  throw new Error('Не задан VITE_OPENAI_MODEL в .env');
}

export const env = {
  apiKey,
  apiUrl,
  model,
};
