import type { ScheduledEvent } from '@/processes/chat-agent/model/schedulerTypes';

export const SCHEDULED_EVENTS_STORAGE_KEY = 'scheduled_events_v1';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isIsoDateString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime());
}

function normalizeEvent(raw: unknown): ScheduledEvent | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null;
  }

  const candidate = raw as Partial<ScheduledEvent>;
  if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0) {
    return null;
  }
  if (typeof candidate.action !== 'string' || candidate.action.trim().length === 0) {
    return null;
  }
  if (!isFiniteNumber(candidate.intervalSeconds) || candidate.intervalSeconds < 10 || candidate.intervalSeconds > 86400) {
    return null;
  }
  if (!isIsoDateString(candidate.createdAt) || !isIsoDateString(candidate.nextRunAt)) {
    return null;
  }
  if (typeof candidate.repeat !== 'object' || candidate.repeat === null || Array.isArray(candidate.repeat)) {
    return null;
  }

  const repeat = candidate.repeat as ScheduledEvent['repeat'];
  if (repeat.mode === 'always') {
    return {
      id: candidate.id,
      action: candidate.action.trim(),
      intervalSeconds: candidate.intervalSeconds,
      repeat: { mode: 'always' },
      createdAt: candidate.createdAt,
      nextRunAt: candidate.nextRunAt,
    };
  }

  if (
    repeat.mode === 'count' &&
    isFiniteNumber(repeat.totalRuns) &&
    isFiniteNumber(repeat.remainingRuns) &&
    repeat.totalRuns >= 1 &&
    repeat.totalRuns <= 100 &&
    repeat.remainingRuns >= 1 &&
    repeat.remainingRuns <= repeat.totalRuns
  ) {
    return {
      id: candidate.id,
      action: candidate.action.trim(),
      intervalSeconds: candidate.intervalSeconds,
      repeat: {
        mode: 'count',
        totalRuns: repeat.totalRuns,
        remainingRuns: repeat.remainingRuns,
      },
      createdAt: candidate.createdAt,
      nextRunAt: candidate.nextRunAt,
    };
  }

  return null;
}

export function loadScheduledEvents(): ScheduledEvent[] {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = globalThis.localStorage.getItem(SCHEDULED_EVENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed
      .map((item) => normalizeEvent(item))
      .filter((item): item is ScheduledEvent => item !== null)
      .sort((left, right) => new Date(left.nextRunAt).getTime() - new Date(right.nextRunAt).getTime());

    return normalized;
  } catch {
    return [];
  }
}

export function saveScheduledEvents(events: ScheduledEvent[]): void {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return;
  }

  globalThis.localStorage.setItem(SCHEDULED_EVENTS_STORAGE_KEY, JSON.stringify(events));
}
