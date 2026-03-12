type OrganizerSchedulerCommand = {
  type: 'organizer';
  method: 'scheduler';
  value: 'plan_action';
  setting: Record<string, never>;
};

function stripJsonCodeFence(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('```') || !trimmed.endsWith('```')) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

export function parseOrganizerSchedulerCommand(rawText: string): OrganizerSchedulerCommand | null {
  const normalized = stripJsonCodeFence(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const command = parsed as Partial<OrganizerSchedulerCommand>;
  if (command.type !== 'organizer' || command.method !== 'scheduler' || command.value !== 'plan_action') {
    return null;
  }

  if (typeof command.setting !== 'object' || command.setting === null || Array.isArray(command.setting)) {
    return null;
  }

  if (Object.keys(command.setting).length > 0) {
    return null;
  }

  return {
    type: 'organizer',
    method: 'scheduler',
    value: 'plan_action',
    setting: {},
  };
}

export function formatMcpDisabledForSchedulerMessage(): string {
  return 'MCP не включен, сначала включите MCP и повторите запрос';
}

export function getSchedulerWizardIntroMessage(): string {
  return [
    'Это планировщик. Я задам несколько вопросов, ответьте на них, и я создам действие.',
    'Для отмены введите "отмена", и планировщик закроется.',
    'Сколько раз напомнить? Введите число от 1 до 100 или слово "всегда".',
  ].join('\n');
}

export function getSchedulerRepeatQuestion(): string {
  return 'Сколько раз напомнить? Введите число от 1 до 100 или слово "всегда".';
}

export function getSchedulerIntervalQuestion(): string {
  return 'Интервал повторения (в секундах). Укажите целое число от 10 до 86400.';
}

export function getSchedulerActionQuestion(): string {
  return 'Укажите действие, которое нужно выполнить и вернуть результат.';
}
