import { postJson } from '@/shared/api/client';
import { loadMcpGithubSettings } from '@/processes/chat-agent/lib/mcpGithubSettings';
import { formatMcpDisabledMessage } from '@/processes/chat-agent/lib/mcpGithubRuntime';

type McpPipelineCommand = {
  type: 'mcp';
  method: 'pipeline';
  value: 'repo_issue_report';
  setting: {
    owner?: unknown;
    repo?: unknown;
  };
};

type McpInvokeResponse = {
  result?: {
    content?: Array<{
      type?: unknown;
      text?: unknown;
    }>;
    structuredContent?: unknown;
    isError?: unknown;
    raw?: {
      content?: Array<{
        type?: unknown;
        text?: unknown;
      }>;
      structuredContent?: unknown;
      isError?: unknown;
    };
  };
};

type PipelineStep<Input, Output> = {
  name: string;
  run: (input: Input, signal?: AbortSignal) => Promise<Output>;
};

type ListIssuesInput = {
  owner: string;
  repo: string;
};

type ListIssuesOutput = {
  owner: string;
  repo: string;
  text: string;
};

type SaveFileOutput = {
  downloadUrl: string;
};

type ResolvePipelineOptions = {
  onStepStart?: (stepName: string) => void;
};

function stripJsonCodeFence(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('```') || !trimmed.endsWith('```')) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function parseMcpPipelineCommand(rawText: string): McpPipelineCommand | null {
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

  const command = parsed as Partial<McpPipelineCommand>;
  if (command.type !== 'mcp' || command.method !== 'pipeline' || command.value !== 'repo_issue_report') {
    return null;
  }

  if (typeof command.setting !== 'object' || command.setting === null || Array.isArray(command.setting)) {
    return null;
  }

  return {
    type: 'mcp',
    method: 'pipeline',
    value: 'repo_issue_report',
    setting: command.setting,
  };
}

function toNonEmptyTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function validateOwnerAndRepo(setting: McpPipelineCommand['setting']): { owner: string; repo: string; missingFields: string[] } {
  const owner = toNonEmptyTrimmedString(setting.owner);
  const repo = toNonEmptyTrimmedString(setting.repo);
  const missingFields: string[] = [];

  if (!owner) {
    missingFields.push('owner');
  }
  if (!repo) {
    missingFields.push('repo');
  }

  return {
    owner: owner ?? '',
    repo: repo ?? '',
    missingFields,
  };
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

function extractTextContent(response: McpInvokeResponse, sourceName: string): string {
  const textContent = response.result?.content?.find((item) => item?.type === 'text' && typeof item.text === 'string');
  if (!textContent || typeof textContent.text !== 'string') {
    throw new Error(`${sourceName} вернул неожиданный формат: отсутствует result.content[].text.`);
  }

  return textContent.text;
}

function extractDownloadUrlFromUnknown(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const url = (value as { downloadUrl?: unknown }).downloadUrl;
  return typeof url === 'string' && url.trim().length > 0 ? url.trim() : null;
}

function extractDownloadUrl(response: McpInvokeResponse): string {
  const direct = extractDownloadUrlFromUnknown(response.result?.structuredContent);
  if (direct) {
    return direct;
  }

  const rawDirect = extractDownloadUrlFromUnknown(response.result?.raw?.structuredContent);
  if (rawDirect) {
    return rawDirect;
  }

  const textPayload = extractTextContent(response, 'MCP file-tools');
  let parsed: unknown;
  try {
    parsed = JSON.parse(textPayload);
  } catch {
    throw new Error('MCP file-tools вернул невалидный JSON в result.content[].text.');
  }

  const urlFromText = extractDownloadUrlFromUnknown(parsed);
  if (!urlFromText) {
    throw new Error('MCP file-tools вернул неожиданный payload: отсутствует downloadUrl.');
  }

  return urlFromText;
}

async function runPipeline<TInput, TOutput>(
  steps: Array<PipelineStep<unknown, unknown>>,
  initialInput: TInput,
  options: ResolvePipelineOptions | undefined,
  signal?: AbortSignal,
): Promise<TOutput> {
  let current: unknown = initialInput;
  for (const step of steps) {
    options?.onStepStart?.(step.name);
    try {
      current = await step.run(current, signal);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка шага ${step.name}: ${message}`);
    }
  }

  return current as TOutput;
}

async function invokeGithubListIssues(baseUrl: string, input: ListIssuesInput, signal?: AbortSignal): Promise<ListIssuesOutput> {
  const url = `${baseUrl}/github/tools/list_issues/invoke`;
  const response = await postJson<McpInvokeResponse>(
    url,
    {
      args: {
        owner: input.owner,
        repo: input.repo,
        state: 'open',
        sort: 'updated',
        per_page: 10,
      },
    },
    {},
    { signal },
  );

  const text = extractTextContent(response, 'MCP github');
  return {
    owner: input.owner,
    repo: input.repo,
    text,
  };
}

async function invokeFileSaveText(baseUrl: string, input: ListIssuesOutput, signal?: AbortSignal): Promise<SaveFileOutput> {
  const url = `${baseUrl}/file-tools/tools/save_text_to_file/invoke`;
  const response = await postJson<McpInvokeResponse>(
    url,
    {
      args: {
        text: input.text,
        fileName: `${input.owner}_${input.repo}_issues`,
      },
    },
    {},
    { signal },
  );

  return {
    downloadUrl: extractDownloadUrl(response),
  };
}

function formatMissingSettingMessage(missingFields: string[]): string {
  return [
    'Недостаточно или некорректно данных для запуска отчета по issue.',
    `Не хватает полей: ${missingFields.join(', ')}.`,
    'Повторите запрос с корректными owner и repo.',
  ].join('\n');
}

function formatIssueReportSuccess(downloadUrl: string): string {
  return [
    'Отчет по issue сформирован.',
    `Ссылка на скачивание: ${downloadUrl}`,
  ].join('\n');
}

export async function resolveMcpPipelineAssistantText(
  rawAssistantText: string,
  signal?: AbortSignal,
  options?: ResolvePipelineOptions,
): Promise<string> {
  const command = parseMcpPipelineCommand(rawAssistantText);
  if (!command) {
    return rawAssistantText;
  }

  const settings = loadMcpGithubSettings();
  if (!settings.enabled) {
    return formatMcpDisabledMessage();
  }

  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  if (!baseUrl) {
    return 'Укажите корректный адрес MCP GitHub в настройках агента и повторите запрос.';
  }

  const validated = validateOwnerAndRepo(command.setting);
  if (validated.missingFields.length > 0) {
    return formatMissingSettingMessage(validated.missingFields);
  }

  const steps: Array<PipelineStep<unknown, unknown>> = [
    {
      name: 'mcp_github(list_issues)',
      run: async (input, currentSignal) => invokeGithubListIssues(baseUrl, input as ListIssuesInput, currentSignal),
    },
    {
      name: 'mcp_file(save_text_to_file)',
      run: async (input, currentSignal) => invokeFileSaveText(baseUrl, input as ListIssuesOutput, currentSignal),
    },
  ];

  try {
    const result = await runPipeline<ListIssuesInput, SaveFileOutput>(
      steps,
      {
        owner: validated.owner,
        repo: validated.repo,
      },
      options,
      signal,
    );

    return formatIssueReportSuccess(result.downloadUrl);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return `Не удалось выполнить pipeline repo_issue_report: ${message}`;
  }
}
