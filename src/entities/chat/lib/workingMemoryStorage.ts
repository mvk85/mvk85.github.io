import { CHAT_WORKING_MEMORY_STORAGE_KEY } from '@/entities/chat/lib/constants';
import type { WorkingMemory, WorkingMemoryTask, WorkingMemoryTaskStatus } from '@/entities/chat/model/types';

type StoredWorkingMemoryMap = Record<string, unknown>;

const VALID_TASK_STATUSES: WorkingMemoryTaskStatus[] = ['todo', 'in_progress', 'done', 'blocked'];

function isValidTaskStatus(value: unknown): value is WorkingMemoryTaskStatus {
  return typeof value === 'string' && VALID_TASK_STATUSES.includes(value as WorkingMemoryTaskStatus);
}

function normalizeTask(value: unknown, fallbackIndex: number): WorkingMemoryTask | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<WorkingMemoryTask>;
  if (typeof candidate.title !== 'string' || candidate.title.trim().length === 0 || !isValidTaskStatus(candidate.status)) {
    return null;
  }

  return {
    id:
      typeof candidate.id === 'string' && candidate.id.trim().length > 0
        ? candidate.id.trim()
        : `task_auto_${String(fallbackIndex).padStart(3, '0')}`,
    title: candidate.title.trim(),
    status: candidate.status,
    notes: typeof candidate.notes === 'string' && candidate.notes.trim().length > 0 ? candidate.notes.trim() : undefined,
  };
}

export function normalizeWorkingMemory(value: unknown): WorkingMemory | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<WorkingMemory>;
  const tasksSource = Array.isArray(candidate.tasks) ? candidate.tasks : [];
  const tasks = tasksSource
    .map((item, index) => normalizeTask(item, index + 1))
    .filter((item): item is WorkingMemoryTask => item !== null);

  const constraintsSource = Array.isArray(candidate.constraints) ? candidate.constraints : [];
  const constraints = constraintsSource.reduce<string[]>((accumulator, item) => {
    if (typeof item !== 'string') {
      return accumulator;
    }

    const normalized = item.trim();
    if (normalized.length > 0) {
      accumulator.push(normalized);
    }
    return accumulator;
  }, []);

  return {
    goal: typeof candidate.goal === 'string' && candidate.goal.trim().length > 0 ? candidate.goal.trim() : null,
    tasks,
    current_focus: typeof candidate.current_focus === 'string' && candidate.current_focus.trim().length > 0 ? candidate.current_focus.trim() : null,
    constraints,
    updated_at: typeof candidate.updated_at === 'string' && candidate.updated_at.trim().length > 0 ? candidate.updated_at : new Date().toISOString(),
  };
}

export function saveWorkingMemoryByChat(map: Record<string, WorkingMemory>): void {
  localStorage.setItem(CHAT_WORKING_MEMORY_STORAGE_KEY, JSON.stringify(map));
}

export function loadWorkingMemoryByChat(): Record<string, WorkingMemory> {
  const raw = localStorage.getItem(CHAT_WORKING_MEMORY_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as StoredWorkingMemoryMap;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    const normalizedEntries = Object.entries(parsed).reduce<Record<string, WorkingMemory>>((accumulator, [chatId, memory]) => {
      if (typeof chatId !== 'string' || chatId.trim().length === 0) {
        return accumulator;
      }

      const normalizedMemory = normalizeWorkingMemory(memory);
      if (normalizedMemory) {
        accumulator[chatId] = normalizedMemory;
      }
      return accumulator;
    }, {});

    return normalizedEntries;
  } catch {
    return {};
  }
}

export function deleteWorkingMemoryForChat(map: Record<string, WorkingMemory>, chatId: string): Record<string, WorkingMemory> {
  const { [chatId]: _, ...rest } = map;
  return rest;
}
