import { CHAT_LONG_TERM_MEMORY_STORAGE_KEY, LONG_TERM_MEMORY_LIMIT } from '@/entities/chat/lib/constants';
import type { LongTermMemoryItem, LongTermMemoryKind } from '@/entities/chat/model/types';

type StoredLongTermMemory = {
  items?: unknown;
};

const VALID_KINDS: LongTermMemoryKind[] = ['profile', 'preference', 'knowledge', 'decision'];

function isValidKind(value: unknown): value is LongTermMemoryKind {
  return typeof value === 'string' && VALID_KINDS.includes(value as LongTermMemoryKind);
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0.5;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function normalizeLongTermMemoryItem(value: unknown, fallbackIndex: number): LongTermMemoryItem | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<LongTermMemoryItem>;
  if (!isValidKind(candidate.kind) || typeof candidate.text !== 'string' || candidate.text.trim().length === 0) {
    return null;
  }

  return {
    id:
      typeof candidate.id === 'string' && candidate.id.trim().length > 0
        ? candidate.id.trim()
        : `memory_${candidate.kind}_${String(fallbackIndex).padStart(3, '0')}`,
    kind: candidate.kind,
    text: candidate.text.trim(),
    confidence: normalizeConfidence(candidate.confidence),
    updated_at: typeof candidate.updated_at === 'string' && candidate.updated_at.trim().length > 0 ? candidate.updated_at : new Date().toISOString(),
  };
}

export function normalizeLongTermMemoryItems(items: unknown): LongTermMemoryItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized = items
    .map((item, index) => normalizeLongTermMemoryItem(item, index + 1))
    .filter((item): item is LongTermMemoryItem => item !== null);

  return normalized.slice(-LONG_TERM_MEMORY_LIMIT);
}

export function loadLongTermMemory(): LongTermMemoryItem[] {
  const raw = localStorage.getItem(CHAT_LONG_TERM_MEMORY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredLongTermMemory | unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return [];
    }

    const candidate = parsed as StoredLongTermMemory;
    return normalizeLongTermMemoryItems(candidate.items);
  } catch {
    return [];
  }
}

export function saveLongTermMemory(items: LongTermMemoryItem[]): void {
  localStorage.setItem(
    CHAT_LONG_TERM_MEMORY_STORAGE_KEY,
    JSON.stringify({
      items: normalizeLongTermMemoryItems(items),
    }),
  );
}

export function resetLongTermMemory(): LongTermMemoryItem[] {
  const empty: LongTermMemoryItem[] = [];
  saveLongTermMemory(empty);
  return empty;
}
