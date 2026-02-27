/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_API_URL?: string;
  readonly VITE_OPENAI_MODEL?: string;
  readonly VITE_PROXYAPI_API_KEY?: string;
  readonly VITE_PROXYAPI_BALANCE_URL?: string;
  readonly VITE_BASE_PATH?: string;

  readonly VITE_LLM_MODEL_MAIN?: string;
  readonly VITE_LLM_MODEL_SUMMARY?: string;
  readonly VITE_SUMMARY_CHUNK_SIZE?: string;
  readonly VITE_SUMMARY_KEEP_LAST?: string;
  readonly VITE_SUMMARY_ENABLED_DEFAULT?: string;
  readonly VITE_SUMMARY_LANGUAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
