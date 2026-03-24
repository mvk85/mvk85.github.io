export const CHAT_AGENT_SETTINGS_STORAGE_KEY = 'chat_agent_settings_v1';

export type ChatAgentSettings = {
  requestBalance: boolean;
  memoryEnabled: boolean;
};

type StoredChatAgentSettings = {
  requestBalance?: unknown;
  memoryEnabled?: unknown;
};

export function loadChatAgentSettings(): ChatAgentSettings {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return {
      requestBalance: false,
      memoryEnabled: false,
    };
  }

  try {
    const raw = globalThis.localStorage.getItem(CHAT_AGENT_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        requestBalance: false,
        memoryEnabled: false,
      };
    }

    const parsed = JSON.parse(raw) as StoredChatAgentSettings;
    return {
      requestBalance: parsed.requestBalance === true,
      memoryEnabled: parsed.memoryEnabled === true,
    };
  } catch {
    return {
      requestBalance: false,
      memoryEnabled: false,
    };
  }
}

export function saveChatAgentSettings(settings: ChatAgentSettings): void {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return;
  }

  globalThis.localStorage.setItem(
    CHAT_AGENT_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      requestBalance: settings.requestBalance,
      memoryEnabled: settings.memoryEnabled,
    }),
  );
}
