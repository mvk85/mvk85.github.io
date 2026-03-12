import { describe, expect, it } from 'vitest';

import {
  formatMcpDisabledForSchedulerMessage,
  getSchedulerWizardIntroMessage,
  parseOrganizerSchedulerCommand,
} from '../src/processes/chat-agent/lib/organizerSchedulerRuntime';

describe('organizer scheduler runtime', () => {
  it('parses plan_action command', () => {
    const parsed = parseOrganizerSchedulerCommand('{"type":"organizer","method":"scheduler","value":"plan_action","setting":{}}');
    expect(parsed).toEqual({
      type: 'organizer',
      method: 'scheduler',
      value: 'plan_action',
      setting: {},
    });
  });

  it('rejects organizer command with non-empty setting', () => {
    const parsed = parseOrganizerSchedulerCommand(
      '{"type":"organizer","method":"scheduler","value":"plan_action","setting":{"query":"x"}}',
    );
    expect(parsed).toBeNull();
  });

  it('returns expected static texts', () => {
    expect(formatMcpDisabledForSchedulerMessage()).toContain('MCP не включен');
    expect(getSchedulerWizardIntroMessage()).toContain('Для отмены введите "отмена"');
  });
});
