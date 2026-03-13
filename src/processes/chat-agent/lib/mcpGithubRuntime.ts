import { postJson } from '@/shared/api/client';
import { loadMcpGithubSettings } from '@/processes/chat-agent/lib/mcpGithubSettings';

type McpGithubCommandValue = 'info' | 'my_repo_list' | 'search_repo' | 'get_repo_stars';

type McpGithubCommand = {
  type: 'mcp';
  method: 'github';
  value: McpGithubCommandValue;
  setting: {
    enable: boolean;
    query: string;
  };
};

type McpInvokeResponse = {
  result?: {
    content?: Array<{
      type?: unknown;
      text?: unknown;
    }>;
  };
};

type GithubSearchRepositoryItem = {
  name?: unknown;
  full_name?: unknown;
  html_url?: unknown;
  url?: unknown;
};

type GithubSearchRepositoriesPayload = {
  total_count?: unknown;
  items?: unknown;
};

type GithubRepoStarsPayload = {
  stars_count?: unknown;
};

function stripJsonCodeFence(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('```') || !trimmed.endsWith('```')) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function parseMcpGithubCommand(rawText: string): McpGithubCommand | null {
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

  const command = parsed as Partial<McpGithubCommand>;
  if (command.type !== 'mcp' || command.method !== 'github') {
    return null;
  }

  if (
    command.value !== 'info' &&
    command.value !== 'my_repo_list' &&
    command.value !== 'search_repo' &&
    command.value !== 'get_repo_stars'
  ) {
    return null;
  }

  if (typeof command.setting !== 'object' || command.setting === null) {
    return null;
  }

  const setting = command.setting as { enable?: unknown; query?: unknown };
  if (typeof setting.enable !== 'boolean' || typeof setting.query !== 'string') {
    return null;
  }

  return {
    type: 'mcp',
    method: 'github',
    value: command.value,
    setting: {
      enable: setting.enable,
      query: setting.query,
    },
  };
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function formatGithubCapabilities(enabled: boolean): string {
  const statusLine = enabled ? 'MCP GitHub включен.' : 'MCP GitHub выключен.';

  return [
    statusLine,
    'MCP GitHub поддерживает:',
    '- Поиск репозитория по имени. Пример: "найди репозиторий react router в github".',
    '- Вывод списка ваших репозиториев. Пример: "выведи список моих репозиториев".',
    '- Вывод количества звезд репозитория. Пример: "выведи количество звезд репозитория openclaw/openclaw".',
  ].join('\n');
}

export function formatMcpDisabledMessage(): string {
  return ['Для работы с GitHub включите MCP в настройках агента и повторите запрос.', '', formatGithubCapabilities(false)].join('\n');
}

function normalizeBaseUrl(rawBaseUrl: string): string | null {
  const trimmed = rawBaseUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return trimmed.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function extractGithubSearchPayload(response: McpInvokeResponse): GithubSearchRepositoriesPayload {
  const textContent = response.result?.content?.find((item) => item?.type === 'text' && typeof item.text === 'string');
  if (!textContent || typeof textContent.text !== 'string') {
    throw new Error('MCP github вернул неожиданный формат: отсутствует result.content[].text.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textContent.text);
  } catch {
    throw new Error('MCP github вернул невалидный JSON в result.content[].text.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('MCP github вернул неожиданный payload результата поиска.');
  }

  return parsed as GithubSearchRepositoriesPayload;
}

function extractGithubRepoStarsPayload(response: McpInvokeResponse): GithubRepoStarsPayload {
  const textContent = response.result?.content?.find((item) => item?.type === 'text' && typeof item.text === 'string');
  if (!textContent || typeof textContent.text !== 'string') {
    throw new Error('MCP github вернул неожиданный формат: отсутствует result.content[].text.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textContent.text);
  } catch {
    throw new Error('MCP github вернул невалидный JSON в result.content[].text.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('MCP github вернул неожиданный payload количества звезд.');
  }

  return parsed as GithubRepoStarsPayload;
}

function formatRepositoryList(
  payload: GithubSearchRepositoriesPayload,
  options: { title: string; emptyText: string },
): string {
  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];
  const items = itemsRaw as GithubSearchRepositoryItem[];
  const totalCount = typeof payload.total_count === 'number' && Number.isFinite(payload.total_count) ? payload.total_count : items.length;

  if (items.length === 0) {
    return `${options.emptyText}\n\nНайдено: 0.`;
  }

  const listLines = items.map((repo) => {
    const name = toNonEmptyString(repo.full_name) ?? toNonEmptyString(repo.name) ?? 'repository';
    const link = toNonEmptyString(repo.html_url) ?? toNonEmptyString(repo.url);
    if (!link) {
      return `- ${name}`;
    }

    return `- [${name}](${link})`;
  });

  return [options.title, `Найдено: ${totalCount}.`, '', ...listLines].join('\n');
}

async function searchRepositories(baseUrl: string, query: string, signal?: AbortSignal): Promise<GithubSearchRepositoriesPayload> {
  const url = `${baseUrl}/github/tools/search_repositories/invoke`;
  const response = await postJson<McpInvokeResponse>(
    url,
    {
      args: {
        query,
        perPage: 20,
        page: 1,
      },
    },
    {},
    { signal },
  );

  return extractGithubSearchPayload(response);
}

function parseRepositoryOwnerAndName(query: string): { owner: string; repo: string } | null {
  const normalized = query.trim();
  if (!normalized) {
    return null;
  }

  const parts = normalized.split('/');
  if (parts.length !== 2) {
    return null;
  }

  const owner = parts[0].trim();
  const repo = parts[1].trim();
  if (!owner || !repo) {
    return null;
  }

  const allowedPartPattern = /^[A-Za-z0-9_.-]+$/;
  if (!allowedPartPattern.test(owner) || !allowedPartPattern.test(repo)) {
    return null;
  }

  return { owner, repo };
}

function formatMissingRepositoryForStarsMessage(): string {
  return [
    'Нужно указать репозиторий в формате owner/repo.',
    'Повторите запрос и укажите имя владельца и имя репозитория (это видно в URL, например в https://github.com/openclaw/openclaw это openclaw и openclaw).',
  ].join('\n');
}

function formatRepositoryStars(owner: string, repo: string, starsCount: number): string {
  return [`Репозиторий: ${owner}/${repo}.`, `Количество звезд: ${starsCount}.`].join('\n');
}

async function getRepositoryStars(baseUrl: string, owner: string, repo: string, signal?: AbortSignal): Promise<number> {
  const url = `${baseUrl}/github/tools/get_repo_stars/invoke`;
  const response = await postJson<McpInvokeResponse>(
    url,
    {
      args: {
        owner,
        repo,
      },
    },
    {},
    { signal },
  );

  const payload = extractGithubRepoStarsPayload(response);
  const starsCount = payload.stars_count;
  if (typeof starsCount !== 'number' || !Number.isFinite(starsCount)) {
    throw new Error('MCP github вернул неожиданный payload количества звезд: отсутствует stars_count.');
  }

  return starsCount;
}

async function resolveEnabledCommand(command: McpGithubCommand, signal?: AbortSignal): Promise<string> {
  const settings = loadMcpGithubSettings();

  if (command.value === 'info') {
    return formatGithubCapabilities(true);
  }

  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  if (!baseUrl) {
    return 'Укажите корректный адрес MCP GitHub в настройках агента и повторите запрос.';
  }

  if (command.value === 'search_repo') {
    const query = command.setting.query.trim();
    if (!query) {
      return 'Имя репозитория должно быть указано.';
    }

    const payload = await searchRepositories(baseUrl, `${query} in:name`, signal);
    return formatRepositoryList(payload, {
      title: `Результаты поиска репозиториев по запросу "${query}"`,
      emptyText: `Репозитории по запросу "${query}" не найдены.`,
    });
  }

  if (command.value === 'get_repo_stars') {
    const repositoryData = parseRepositoryOwnerAndName(command.setting.query);
    if (!repositoryData) {
      return formatMissingRepositoryForStarsMessage();
    }

    const starsCount = await getRepositoryStars(baseUrl, repositoryData.owner, repositoryData.repo, signal);
    return formatRepositoryStars(repositoryData.owner, repositoryData.repo, starsCount);
  }

  const username = settings.username.trim();
  const payload = await searchRepositories(baseUrl, `user:${username} in:name`, signal);
  return formatRepositoryList(payload, {
    title: `Список репозиториев пользователя "${username}"`,
    emptyText: `У пользователя "${username}" репозитории не найдены.`,
  });
}

export async function resolveMcpGithubAssistantText(rawAssistantText: string, signal?: AbortSignal): Promise<string> {
  const command = parseMcpGithubCommand(rawAssistantText);
  if (!command) {
    return rawAssistantText;
  }

  if (!command.setting.enable) {
    return formatMcpDisabledMessage();
  }

  try {
    return await resolveEnabledCommand(command, signal);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return `Не удалось выполнить MCP GitHub запрос: ${message}`;
  }
}
