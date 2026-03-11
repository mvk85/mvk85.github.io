export const MCP_GITHUB_SETTINGS_STORAGE_KEY = 'mcp_github_settings_v1';
export const MCP_GITHUB_DEFAULT_USERNAME = 'mvk85';

type StoredMcpGithubSettings = {
  enabled?: unknown;
  baseUrl?: unknown;
  username?: unknown;
};

export type McpGithubSettings = {
  enabled: boolean;
  baseUrl: string;
  username: string;
};

function normalizeUsername(value: unknown): string {
  if (typeof value !== 'string') {
    return MCP_GITHUB_DEFAULT_USERNAME;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : MCP_GITHUB_DEFAULT_USERNAME;
}

export function loadMcpGithubSettings(): McpGithubSettings {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return {
      enabled: false,
      baseUrl: '',
      username: MCP_GITHUB_DEFAULT_USERNAME,
    };
  }

  try {
    const raw = globalThis.localStorage.getItem(MCP_GITHUB_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        enabled: false,
        baseUrl: '',
        username: MCP_GITHUB_DEFAULT_USERNAME,
      };
    }

    const parsed = JSON.parse(raw) as StoredMcpGithubSettings;
    return {
      enabled: parsed.enabled === true,
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      username: normalizeUsername(parsed.username),
    };
  } catch {
    return {
      enabled: false,
      baseUrl: '',
      username: MCP_GITHUB_DEFAULT_USERNAME,
    };
  }
}

export function saveMcpGithubSettings(settings: McpGithubSettings): void {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return;
  }

  globalThis.localStorage.setItem(
    MCP_GITHUB_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      enabled: settings.enabled,
      baseUrl: settings.baseUrl,
      username: normalizeUsername(settings.username),
    }),
  );
}
