export type SchedulerRepeat =
  | {
      mode: 'count';
      totalRuns: number;
      remainingRuns: number;
    }
  | {
      mode: 'always';
    };

export type ScheduledEvent = {
  id: string;
  action: string;
  intervalSeconds: number;
  repeat: SchedulerRepeat;
  createdAt: string;
  nextRunAt: string;
};

export type SchedulerWizardStep = 'repeat' | 'interval' | 'action';

export type SchedulerWizardState = {
  step: SchedulerWizardStep;
  repeat: number | 'always' | null;
  intervalSeconds: number | null;
};
