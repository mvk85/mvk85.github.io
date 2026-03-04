import type { LlmMessage } from '@/entities/chat/model/types';
import { getUserProfileSystemText } from '@/entities/profile/lib/profileConfig';
import type { UserProfileId } from '@/entities/profile/model/types';

export function buildUserProfileSystemMessage(profileId: UserProfileId): LlmMessage | null {
  const profileText = getUserProfileSystemText(profileId);
  if (!profileText) {
    return null;
  }

  return {
    role: 'system',
    content: `Профиль пользователя:\n${profileText}`,
  };
}

export function prependUserProfileToContext(contextMessages: LlmMessage[], profileId: UserProfileId): LlmMessage[] {
  const profileMessage = buildUserProfileSystemMessage(profileId);
  if (!profileMessage) {
    return contextMessages;
  }

  return [profileMessage, ...contextMessages];
}
