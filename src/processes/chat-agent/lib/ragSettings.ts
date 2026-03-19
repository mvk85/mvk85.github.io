export const RAG_SETTINGS_STORAGE_KEY = 'rag_settings_v1';

const DEFAULT_RAG_BASE_URL = 'http://localhost:5001';

type StoredRagSettings = {
  enabled?: unknown;
  baseUrl?: unknown;
  selectedIndexIds?: unknown;
  minScore?: unknown;
  topK?: unknown;
  candidateTopK?: unknown;
  retrievalMode?: unknown;
  rewriteQuery?: unknown;
  compareModes?: unknown;
  askClarificationOnLowRelevance?: unknown;
};

export type RagRetrievalMode = 'baseline' | 'threshold' | 'heuristic';

export type RagSettings = {
  enabled: boolean;
  baseUrl: string;
  selectedIndexIds: string[];
  minScore: number;
  topK: number;
  candidateTopK: number;
  retrievalMode: RagRetrievalMode;
  rewriteQuery: boolean;
  compareModes: boolean;
  askClarificationOnLowRelevance: boolean;
};

export const DEFAULT_RAG_MIN_SCORE = 0.5;
export const DEFAULT_RAG_TOP_K = 8;
export const DEFAULT_RAG_CANDIDATE_TOP_K = 24;
export const DEFAULT_RAG_RETRIEVAL_MODE: RagRetrievalMode = 'heuristic';
export const DEFAULT_RAG_REWRITE_QUERY = true;
export const DEFAULT_RAG_COMPARE_MODES = false;
export const DEFAULT_RAG_ASK_CLARIFICATION_ON_LOW_RELEVANCE = false;

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

function normalizeCandidateTopK(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_RAG_CANDIDATE_TOP_K;
  }
  const rounded = Math.round(value);
  if (rounded < DEFAULT_RAG_TOP_K) {
    return DEFAULT_RAG_TOP_K;
  }
  if (rounded > 200) {
    return 200;
  }
  return rounded;
}

function normalizeRetrievalMode(value: unknown): RagRetrievalMode {
  if (value === 'baseline' || value === 'threshold' || value === 'heuristic') {
    return value;
  }
  return DEFAULT_RAG_RETRIEVAL_MODE;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

export function loadRagSettings(): RagSettings {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return {
      enabled: false,
      baseUrl: DEFAULT_RAG_BASE_URL,
      selectedIndexIds: [],
      minScore: DEFAULT_RAG_MIN_SCORE,
      topK: DEFAULT_RAG_TOP_K,
      candidateTopK: DEFAULT_RAG_CANDIDATE_TOP_K,
      retrievalMode: DEFAULT_RAG_RETRIEVAL_MODE,
      rewriteQuery: DEFAULT_RAG_REWRITE_QUERY,
      compareModes: DEFAULT_RAG_COMPARE_MODES,
      askClarificationOnLowRelevance: DEFAULT_RAG_ASK_CLARIFICATION_ON_LOW_RELEVANCE,
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
        candidateTopK: DEFAULT_RAG_CANDIDATE_TOP_K,
        retrievalMode: DEFAULT_RAG_RETRIEVAL_MODE,
        rewriteQuery: DEFAULT_RAG_REWRITE_QUERY,
        compareModes: DEFAULT_RAG_COMPARE_MODES,
        askClarificationOnLowRelevance: DEFAULT_RAG_ASK_CLARIFICATION_ON_LOW_RELEVANCE,
      };
    }

    const parsed = JSON.parse(raw) as StoredRagSettings;
    return {
      enabled: parsed.enabled === true,
      baseUrl: normalizeBaseUrl(parsed.baseUrl),
      selectedIndexIds: normalizeSelectedIndexIds(parsed.selectedIndexIds),
      minScore: normalizeMinScore(parsed.minScore),
      topK: DEFAULT_RAG_TOP_K,
      candidateTopK: normalizeCandidateTopK(parsed.candidateTopK),
      retrievalMode: normalizeRetrievalMode(parsed.retrievalMode),
      rewriteQuery: normalizeBoolean(parsed.rewriteQuery, DEFAULT_RAG_REWRITE_QUERY),
      compareModes: normalizeBoolean(parsed.compareModes, DEFAULT_RAG_COMPARE_MODES),
      askClarificationOnLowRelevance: normalizeBoolean(
        parsed.askClarificationOnLowRelevance,
        DEFAULT_RAG_ASK_CLARIFICATION_ON_LOW_RELEVANCE,
      ),
    };
  } catch {
    return {
      enabled: false,
      baseUrl: DEFAULT_RAG_BASE_URL,
      selectedIndexIds: [],
      minScore: DEFAULT_RAG_MIN_SCORE,
      topK: DEFAULT_RAG_TOP_K,
      candidateTopK: DEFAULT_RAG_CANDIDATE_TOP_K,
      retrievalMode: DEFAULT_RAG_RETRIEVAL_MODE,
      rewriteQuery: DEFAULT_RAG_REWRITE_QUERY,
      compareModes: DEFAULT_RAG_COMPARE_MODES,
      askClarificationOnLowRelevance: DEFAULT_RAG_ASK_CLARIFICATION_ON_LOW_RELEVANCE,
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
      candidateTopK: normalizeCandidateTopK(settings.candidateTopK),
      retrievalMode: normalizeRetrievalMode(settings.retrievalMode),
      rewriteQuery: normalizeBoolean(settings.rewriteQuery, DEFAULT_RAG_REWRITE_QUERY),
      compareModes: normalizeBoolean(settings.compareModes, DEFAULT_RAG_COMPARE_MODES),
      askClarificationOnLowRelevance: normalizeBoolean(
        settings.askClarificationOnLowRelevance,
        DEFAULT_RAG_ASK_CLARIFICATION_ON_LOW_RELEVANCE,
      ),
    }),
  );
}
