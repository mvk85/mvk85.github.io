import type { TaskStage } from '@/entities/chat/model/types';

export const TASK_TRANSITIONS: Record<TaskStage, TaskStage[]> = {
  planning: ['execution'],
  execution: ['validation'],
  validation: ['execution', 'done'],
  done: [],
};

export function canTransitionTaskStage(from: TaskStage, to: TaskStage): boolean {
  return TASK_TRANSITIONS[from].includes(to);
}

export function assertTaskTransition(from: TaskStage, to: TaskStage): void {
  if (canTransitionTaskStage(from, to)) {
    return;
  }

  throw new Error(`Недопустимый переход задачи: ${from} -> ${to}`);
}
