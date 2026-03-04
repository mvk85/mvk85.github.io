import { describe, expect, it } from 'vitest';

import { buildUserProfileSystemMessage, prependUserProfileToContext } from '../src/entities/profile/lib/profilePrompt';

describe('profile prompt', () => {
  it('добавляет system-профиль для выбранных профилей и пропускает none', () => {
    const context = [{ role: 'user' as const, content: 'Привет' }];

    const noProfileMessage = buildUserProfileSystemMessage('none');
    expect(noProfileMessage).toBeNull();

    const fullstackMessage = buildUserProfileSystemMessage('fullstack_programmer');
    expect(fullstackMessage).not.toBeNull();
    expect(fullstackMessage?.role).toBe('system');
    expect(fullstackMessage?.content).toContain('Профиль пользователя:');
    expect(fullstackMessage?.content).toContain('# Developer Profile');
    expect(fullstackMessage?.content).toContain('Я могу помочь только по следующим темам');

    const analystMessage = buildUserProfileSystemMessage('analyst');
    expect(analystMessage).not.toBeNull();
    expect(analystMessage?.role).toBe('system');
    expect(analystMessage?.content).toContain('# Analyst Profile (for LLM)');
    expect(analystMessage?.content).toContain('Я могу помочь только по следующим темам');

    const contextWithoutProfile = prependUserProfileToContext(context, 'none');
    expect(contextWithoutProfile).toEqual(context);

    const contextWithProfile = prependUserProfileToContext(context, 'fullstack_programmer');
    expect(contextWithProfile).toHaveLength(2);
    expect(contextWithProfile[0].role).toBe('system');
    expect(contextWithProfile[1]).toEqual(context[0]);
  });
});
