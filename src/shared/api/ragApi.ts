import { getJson, postJson } from '@/shared/api/client';

export type RagHealthResponse = {
  status?: unknown;
  embeddings?: {
    configured?: unknown;
    url?: unknown;
    model?: unknown;
  };
  storageDir?: unknown;
};

export type RagUploadResponse = {
  fileId: string;
  filePath: string;
  originalName: string;
  size: number;
  mimeType: string;
};

export type RagBuildIndexRequest = {
  source: string;
  filePath: string;
  title?: string;
  strategy: 'fixed' | 'structured';
  chunkSize?: number;
  chunkOverlap?: number;
};

export type RagBuildIndexResponse = {
  indexId: string;
  indexPath: string;
  chunksCount: number;
  model: string;
  dimensions: number;
  createdAt: string;
};

type RagIndexMeta = {
  index_id?: unknown;
  source?: unknown;
  file_path?: unknown;
  title?: unknown;
  strategy?: unknown;
  model?: unknown;
  created_at?: unknown;
  dimensions?: unknown;
  chunks_count?: unknown;
};

export type RagIndexListItem = {
  indexId: string;
  indexPath: string;
  indexMeta: {
    indexId: string;
    source: string;
    filePath: string;
    title: string;
    strategy: string;
    model: string;
    createdAt: string;
    dimensions: number;
    chunksCount: number;
  };
};

export type RagChunkMetadata = {
  source: string;
  file: string;
  title: string;
  section: string;
  chunkId: string;
  strategy: string;
  tokenCount: number;
};

export type RagRetrieveMatch = {
  indexId: string;
  score: number;
  text: string;
  metadata: RagChunkMetadata;
};

export type RagRetrieveResponse = {
  indexId: string;
  query: string;
  topK: number;
  matches: RagRetrieveMatch[];
};

export type RagRetrieveMultiResponse = {
  indexIds: string[];
  query: string;
  topK: number;
  searchedIndexIds: string[];
  missingIndexIds: string[];
  matches: RagRetrieveMatch[];
};

type RagRetrieveRequest = {
  indexId: string;
  query: string;
  topK: number;
};

type RagRetrieveMultiRequest = {
  indexIds: string[];
  query: string;
  topK: number;
};

type RagIndexesResponse = {
  indexes?: Array<{
    indexId?: unknown;
    indexPath?: unknown;
    indexMeta?: RagIndexMeta;
  }>;
};

type RagDeleteIndexResponse = {
  deleted: boolean;
  indexId: string;
  indexPath: string;
};

type RagRetrieveMatchRaw = {
  indexId?: unknown;
  score?: unknown;
  text?: unknown;
  metadata?: {
    source?: unknown;
    file?: unknown;
    title?: unknown;
    section?: unknown;
    chunk_id?: unknown;
    strategy?: unknown;
    token_count?: unknown;
  };
};

type RagRetrieveResponseRaw = {
  indexId?: unknown;
  query?: unknown;
  topK?: unknown;
  matches?: RagRetrieveMatchRaw[];
};

type RagRetrieveMultiResponseRaw = {
  indexIds?: unknown;
  query?: unknown;
  topK?: unknown;
  searchedIndexIds?: unknown;
  missingIndexIds?: unknown;
  matches?: RagRetrieveMatchRaw[];
};

function toText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function toFiniteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => toText(item)).filter((item) => item.length > 0);
}

function normalizeRagBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/u, '');
  if (trimmed.endsWith('/rag')) {
    return trimmed;
  }

  return `${trimmed}/rag`;
}

function buildRagUrl(baseUrl: string, endpoint: string): string {
  const normalizedBase = normalizeRagBaseUrl(baseUrl);
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return response.statusText || 'Request failed';
  }

  try {
    const payload = JSON.parse(text) as { message?: unknown; error?: unknown };
    if (Array.isArray(payload.message)) {
      return payload.message.map((item) => toText(item)).filter((item) => item.length > 0).join('; ');
    }
    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }
    if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
      return payload.error;
    }
  } catch {
    return text;
  }

  return response.statusText || 'Request failed';
}

function normalizeRetrieveMatch(raw: RagRetrieveMatchRaw, fallbackIndexId: string): RagRetrieveMatch {
  const metadata = raw.metadata ?? {};
  const indexId = toText(raw.indexId) || fallbackIndexId;
  return {
    indexId,
    score: toFiniteNumber(raw.score),
    text: toText(raw.text),
    metadata: {
      source: toText(metadata.source),
      file: toText(metadata.file),
      title: toText(metadata.title),
      section: toText(metadata.section),
      chunkId: toText(metadata.chunk_id),
      strategy: toText(metadata.strategy),
      tokenCount: toFiniteNumber(metadata.token_count),
    },
  };
}

export const ragApi = {
  checkHealth: async (baseUrl: string, options?: { signal?: AbortSignal }): Promise<RagHealthResponse> => {
    return getJson<RagHealthResponse>(buildRagUrl(baseUrl, '/health'), {}, options);
  },

  uploadFile: async (baseUrl: string, file: File, options?: { signal?: AbortSignal }): Promise<RagUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(buildRagUrl(baseUrl, '/files/upload'), {
      method: 'POST',
      body: formData,
      signal: options?.signal,
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw new Error(message);
    }

    const payload = (await response.json()) as Partial<RagUploadResponse>;
    return {
      fileId: toText(payload.fileId),
      filePath: toText(payload.filePath),
      originalName: toText(payload.originalName),
      size: toFiniteNumber(payload.size),
      mimeType: toText(payload.mimeType),
    };
  },

  buildIndex: async (
    baseUrl: string,
    body: RagBuildIndexRequest,
    options?: { signal?: AbortSignal },
  ): Promise<RagBuildIndexResponse> => {
    return postJson<RagBuildIndexResponse>(buildRagUrl(baseUrl, '/indexes/build'), body, {}, options);
  },

  listIndexes: async (baseUrl: string, options?: { signal?: AbortSignal }): Promise<RagIndexListItem[]> => {
    const response = await getJson<RagIndexesResponse>(buildRagUrl(baseUrl, '/indexes'), {}, options);
    const indexesRaw = Array.isArray(response.indexes) ? response.indexes : [];

    return indexesRaw.map((index) => {
      const meta = index.indexMeta ?? {};
      return {
        indexId: toText(index.indexId),
        indexPath: toText(index.indexPath),
        indexMeta: {
          indexId: toText(meta.index_id),
          source: toText(meta.source),
          filePath: toText(meta.file_path),
          title: toText(meta.title),
          strategy: toText(meta.strategy),
          model: toText(meta.model),
          createdAt: toText(meta.created_at),
          dimensions: toFiniteNumber(meta.dimensions),
          chunksCount: toFiniteNumber(meta.chunks_count),
        },
      };
    });
  },

  deleteIndex: async (baseUrl: string, indexId: string, options?: { signal?: AbortSignal }): Promise<RagDeleteIndexResponse> => {
    const response = await fetch(buildRagUrl(baseUrl, `/indexes/${encodeURIComponent(indexId)}`), {
      method: 'DELETE',
      signal: options?.signal,
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw new Error(message);
    }

    const payload = (await response.json()) as Partial<RagDeleteIndexResponse>;
    return {
      deleted: payload.deleted === true,
      indexId: toText(payload.indexId),
      indexPath: toText(payload.indexPath),
    };
  },

  retrieve: async (baseUrl: string, body: RagRetrieveRequest, options?: { signal?: AbortSignal }): Promise<RagRetrieveResponse> => {
    const response = await postJson<RagRetrieveResponseRaw>(buildRagUrl(baseUrl, '/retrieve'), body, {}, options);
    const resolvedIndexId = toText(response.indexId) || body.indexId;
    const matchesRaw = Array.isArray(response.matches) ? response.matches : [];

    return {
      indexId: resolvedIndexId,
      query: toText(response.query) || body.query,
      topK: toFiniteNumber(response.topK) || body.topK,
      matches: matchesRaw.map((match) => normalizeRetrieveMatch(match, resolvedIndexId)),
    };
  },

  retrieveMulti: async (
    baseUrl: string,
    body: RagRetrieveMultiRequest,
    options?: { signal?: AbortSignal },
  ): Promise<RagRetrieveMultiResponse> => {
    const response = await postJson<RagRetrieveMultiResponseRaw>(buildRagUrl(baseUrl, '/retrieve/multi'), body, {}, options);
    const matchesRaw = Array.isArray(response.matches) ? response.matches : [];

    return {
      indexIds: toTextArray(response.indexIds),
      query: toText(response.query) || body.query,
      topK: toFiniteNumber(response.topK) || body.topK,
      searchedIndexIds: toTextArray(response.searchedIndexIds),
      missingIndexIds: toTextArray(response.missingIndexIds),
      matches: matchesRaw.map((match) => normalizeRetrieveMatch(match, '')),
    };
  },
};
