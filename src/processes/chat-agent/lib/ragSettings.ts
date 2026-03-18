export const RAG_SETTINGS_STORAGE_KEY = 'rag_settings_v1';

const DEFAULT_RAG_BASE_URL = 'http://localhost:5001';

type StoredRagSettings = {
  enabled?: unknown;
  baseUrl?: unknown;
  selectedIndexIds?: unknown;
  minScore?: unknown;
  topK?: unknown;
};

export type RagSettings = {
  enabled: boolean;
  baseUrl: string;
  selectedIndexIds: string[];
  minScore: number;
  topK: number;
};

export const DEFAULT_RAG_MIN_SCORE = 0.5;
export const DEFAULT_RAG_TOP_K = 8;

function normalizeBaseUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return DEFAULT_RAG_BASE_URL;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_RAG_BASE_URL;
}

function normalizeSelectedIndexIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduplicated = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }
    const normalized = item.trim();
    if (!normalized) {
      continue;
    }
    deduplicated.add(normalized);
  }

  return [...deduplicated];
}

function normalizeMinScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_RAG_MIN_SCORE;
  }

  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function loadRagSettings(): RagSettings {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return {
      enabled: false,
      baseUrl: DEFAULT_RAG_BASE_URL,
      selectedIndexIds: [],
      minScore: DEFAULT_RAG_MIN_SCORE,
      topK: DEFAULT_RAG_TOP_K,
    };
  }

  try {
    const raw = globalThis.localStorage.getItem(RAG_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        enabled: false,
        baseUrl: DEFAULT_RAG_BASE_URL,
        selectedIndexIds: [],
        minScore: DEFAULT_RAG_MIN_SCORE,
        topK: DEFAULT_RAG_TOP_K,
      };
    }

    const parsed = JSON.parse(raw) as StoredRagSettings;
    return {
      enabled: parsed.enabled === true,
      baseUrl: normalizeBaseUrl(parsed.baseUrl),
      selectedIndexIds: normalizeSelectedIndexIds(parsed.selectedIndexIds),
      minScore: normalizeMinScore(parsed.minScore),
      topK: DEFAULT_RAG_TOP_K,
    };
  } catch {
    return {
      enabled: false,
      baseUrl: DEFAULT_RAG_BASE_URL,
      selectedIndexIds: [],
      minScore: DEFAULT_RAG_MIN_SCORE,
      topK: DEFAULT_RAG_TOP_K,
    };
  }
}

export function saveRagSettings(settings: RagSettings): void {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return;
  }

  globalThis.localStorage.setItem(
    RAG_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      enabled: settings.enabled,
      baseUrl: normalizeBaseUrl(settings.baseUrl),
      selectedIndexIds: normalizeSelectedIndexIds(settings.selectedIndexIds),
      minScore: normalizeMinScore(settings.minScore),
      topK: DEFAULT_RAG_TOP_K,
    }),
  );
}
