/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_API_URL?: string;
  readonly VITE_OPENAI_MODEL?: string;
  readonly VITE_PROXYAPI_BALANCE_URL?: string;
  readonly VITE_PROXYAPI_API_KEY?: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
