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
  issues: unknown[];
};

type SummaryOutput = {
  owner: string;
  repo: string;
  text: string;
};

type SaveFileOutput = {
  downloadUrl: string;
};

type ResolvePipelineOptions = {
  onStepStart?: (stepName: string) => void;
  summaryPrompt?: string;
  requestSummaryPrompt?: boolean;
};

export type PendingIssueReportSummary = {
  owner: string;
  repo: string;
  question: string;
};

export type ResolveMcpPipelineResult =
  | {
      kind: 'text';
      text: string;
    }
  | {
      kind: 'needs_summary_prompt';
      pending: PendingIssueReportSummary;
    };

const SUMMARY_DECLINE_PATTERNS = new Set(['нет', 'no']);
const SUMMARY_QUESTION =
  'Нужна ли какая-то суммаризация по отчету, например "Сделай суммаризацию по полю theme: количество, основные проблемы и приоритеты.". Если не нужна, то напиши просто "нет"';

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

function shouldRunSummaryStep(summaryPrompt: string | undefined): boolean {
  if (!summaryPrompt) {
    return false;
  }

  const normalized = summaryPrompt.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return !SUMMARY_DECLINE_PATTERNS.has(normalized);
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

function extractIssuesFromListPayload(textPayload: string): unknown[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(textPayload);
  } catch {
    throw new Error('MCP github вернул невалидный JSON с issue для pipeline.');
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('MCP github вернул неожиданный payload issue: ожидается объект или массив.');
  }

  const issues = (parsed as { issues?: unknown }).issues;
  if (!Array.isArray(issues)) {
    throw new Error('MCP github вернул неожиданный payload issue: отсутствует массив issues.');
  }

  return issues;
}

function extractSummaryText(response: McpInvokeResponse): string {
  const structured = response.result?.structuredContent;
  if (typeof structured === 'object' && structured !== null && !Array.isArray(structured)) {
    const summary = (structured as { summary?: unknown }).summary;
    if (typeof summary === 'string' && summary.trim().length > 0) {
      return summary.trim();
    }
  }

  const rawStructured = response.result?.raw?.structuredContent;
  if (typeof rawStructured === 'object' && rawStructured !== null && !Array.isArray(rawStructured)) {
    const summary = (rawStructured as { summary?: unknown }).summary;
    if (typeof summary === 'string' && summary.trim().length > 0) {
      return summary.trim();
    }
  }

  const textPayload = extractTextContent(response, 'MCP summary_json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(textPayload);
  } catch {
    if (textPayload.trim().length > 0) {
      return textPayload.trim();
    }
    throw new Error('MCP summary_json вернул пустой текстовый payload.');
  }

  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    const summary = (parsed as { summary?: unknown }).summary;
    if (typeof summary === 'string' && summary.trim().length > 0) {
      return summary.trim();
    }
  }

  throw new Error('MCP summary_json вернул неожиданный payload: отсутствует summary.');
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
    issues: extractIssuesFromListPayload(text),
  };
}

async function invokeSummaryJson(
  baseUrl: string,
  input: ListIssuesOutput,
  summaryPrompt: string,
  signal?: AbortSignal,
): Promise<SummaryOutput> {
  const url = `${baseUrl}/llm/tools/summary_json/invoke`;
  const response = await postJson<McpInvokeResponse>(
    url,
    {
      args: {
        issues: input.issues,
        prompt: summaryPrompt,
      },
    },
    {},
    { signal },
  );

  return {
    owner: input.owner,
    repo: input.repo,
    text: extractSummaryText(response),
  };
}

async function invokeFileSaveText(baseUrl: string, input: { owner: string; repo: string; text: string }, signal?: AbortSignal): Promise<SaveFileOutput> {
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

export async function resolveMcpPipelineAssistantCommand(
  rawAssistantText: string,
  signal?: AbortSignal,
  options?: ResolvePipelineOptions,
): Promise<ResolveMcpPipelineResult> {
  const command = parseMcpPipelineCommand(rawAssistantText);
  if (!command) {
    return {
      kind: 'text',
      text: rawAssistantText,
    };
  }

  const settings = loadMcpGithubSettings();
  if (!settings.enabled) {
    return {
      kind: 'text',
      text: formatMcpDisabledMessage(),
    };
  }

  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  if (!baseUrl) {
    return {
      kind: 'text',
      text: 'Укажите корректный адрес MCP GitHub в настройках агента и повторите запрос.',
    };
  }

  const validated = validateOwnerAndRepo(command.setting);
  if (validated.missingFields.length > 0) {
    return {
      kind: 'text',
      text: formatMissingSettingMessage(validated.missingFields),
    };
  }

  if (options?.requestSummaryPrompt) {
    return {
      kind: 'needs_summary_prompt',
      pending: {
        owner: validated.owner,
        repo: validated.repo,
        question: SUMMARY_QUESTION,
      },
    };
  }

  const shouldSummarize = shouldRunSummaryStep(options?.summaryPrompt);
  const steps: Array<PipelineStep<unknown, unknown>> = [
    {
      name: 'mcp_github(list_issues)',
      run: async (input, currentSignal) => invokeGithubListIssues(baseUrl, input as ListIssuesInput, currentSignal),
    },
  ];
  if (shouldSummarize && options?.summaryPrompt) {
    steps.push({
      name: 'mcp_summary(summary_json)',
      run: async (input, currentSignal) => invokeSummaryJson(baseUrl, input as ListIssuesOutput, options.summaryPrompt as string, currentSignal),
    });
  }
  steps.push({
    name: 'mcp_file(save_text_to_file)',
    run: async (input, currentSignal) => invokeFileSaveText(baseUrl, input as { owner: string; repo: string; text: string }, currentSignal),
  });

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

    return {
      kind: 'text',
      text: formatIssueReportSuccess(result.downloadUrl),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return {
      kind: 'text',
      text: `Не удалось выполнить pipeline repo_issue_report: ${message}`,
    };
  }
}

export async function resolveMcpPipelineAssistantText(
  rawAssistantText: string,
  signal?: AbortSignal,
  options?: Omit<ResolvePipelineOptions, 'requestSummaryPrompt'>,
): Promise<string> {
  const result = await resolveMcpPipelineAssistantCommand(rawAssistantText, signal, {
    ...options,
    requestSummaryPrompt: false,
  });

  if (result.kind === 'needs_summary_prompt') {
    return result.pending.question;
  }

  return result.text;
}
