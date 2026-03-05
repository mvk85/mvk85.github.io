import { describe, expect, it } from 'vitest';

import { assertTaskTransition, canTransitionTaskStage, TASK_TRANSITIONS } from '../src/entities/chat/lib/taskStateMachine';

describe('task state machine', () => {
  it('разрешает только допустимые переходы', () => {
    expect(TASK_TRANSITIONS.planning).toEqual(['execution']);
    expect(TASK_TRANSITIONS.execution).toEqual(['validation']);
    expect(TASK_TRANSITIONS.validation).toEqual(['execution', 'done']);
    expect(TASK_TRANSITIONS.done).toEqual([]);
    expect(canTransitionTaskStage('planning', 'execution')).toBe(true);
    expect(canTransitionTaskStage('execution', 'validation')).toBe(true);
    expect(canTransitionTaskStage('validation', 'execution')).toBe(true);
    expect(canTransitionTaskStage('validation', 'done')).toBe(true);
  });

  it('блокирует недопустимые переходы', () => {
    expect(canTransitionTaskStage('planning', 'validation')).toBe(false);
    expect(canTransitionTaskStage('execution', 'done')).toBe(false);
    expect(() => assertTaskTransition('planning', 'done')).toThrow('Недопустимый переход задачи');
  });
});
