import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resolveMcpPipelineAssistantCommand,
  resolveMcpPipelineAssistantText,
} from '../src/processes/chat-agent/lib/mcpPipelineGithubIssuesRuntime';

const fetchMock = vi.fn();

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('mcp pipeline runtime repo_issue_report', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      configurable: true,
    });
    fetchMock.mockReset();
  });

  it('returns disabled message when MCP is off', async () => {
    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: false,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    const text = await resolveMcpPipelineAssistantText(
      '{"type":"mcp","method":"pipeline","value":"repo_issue_report","setting":{"owner":"openclaw","repo":"openclaw"}}',
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(text).toContain('Для работы с GitHub включите MCP в настройках агента и повторите запрос.');
  });

  it('returns validation message when owner is missing', async () => {
    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    const text = await resolveMcpPipelineAssistantText(
      '{"type":"mcp","method":"pipeline","value":"repo_issue_report","setting":{"owner":"","repo":"openclaw"}}',
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(text).toContain('Не хватает полей: owner.');
  });

  it('returns summary clarification request when enabled by caller', async () => {
    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    const result = await resolveMcpPipelineAssistantCommand(
      '{"type":"mcp","method":"pipeline","value":"repo_issue_report","setting":{"owner":"openclaw","repo":"openclaw"}}',
      undefined,
      { requestSummaryPrompt: true },
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.kind).toBe('needs_summary_prompt');
    if (result.kind === 'needs_summary_prompt') {
      expect(result.pending.owner).toBe('openclaw');
      expect(result.pending.repo).toBe('openclaw');
      expect(result.pending.question).toContain('Нужна ли какая-то суммаризация по отчету');
    }
  });

  it('runs github list_issues and file save_text_to_file and returns download link', async () => {
    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () =>
          JSON.stringify({
            result: {
              content: [
                {
                  type: 'text',
                  text: '{"issues":[{"id":1,"title":"bug"}]}',
                },
              ],
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () =>
          JSON.stringify({
            result: {
              structuredContent: {
                downloadUrl: 'http://localhost:3001/downloads/openclaw_openclaw_issues.txt',
              },
            },
          }),
      });

    const text = await resolveMcpPipelineAssistantText(
      '{"type":"mcp","method":"pipeline","value":"repo_issue_report","setting":{"owner":"openclaw","repo":"openclaw"}}',
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [firstUrl, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(firstUrl).toBe('http://localhost:3001/mcp/github/tools/list_issues/invoke');
    expect(String(firstInit.body)).toContain('"owner":"openclaw"');
    expect(String(firstInit.body)).toContain('"repo":"openclaw"');

    const [secondUrl, secondInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(secondUrl).toBe('http://localhost:3001/mcp/file-tools/tools/save_text_to_file/invoke');
    expect(String(secondInit.body)).toContain('"fileName":"openclaw_openclaw_issues"');

    expect(text).toContain('Отчет по issue сформирован.');
    expect(text).toContain('http://localhost:3001/downloads/openclaw_openclaw_issues.txt');
  });

  it('reports pipeline step start for each MCP in order', async () => {
    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () =>
          JSON.stringify({
            result: {
              content: [
                {
                  type: 'text',
                  text: '{"issues":[{"id":1}]}',
                },
              ],
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () =>
          JSON.stringify({
            result: {
              structuredContent: {
                downloadUrl: 'http://localhost:3001/downloads/openclaw_openclaw_issues.txt',
              },
            },
          }),
      });

    const stepStart = vi.fn();
    await resolveMcpPipelineAssistantText(
      '{"type":"mcp","method":"pipeline","value":"repo_issue_report","setting":{"owner":"openclaw","repo":"openclaw"}}',
      undefined,
      { onStepStart: stepStart },
    );

    expect(stepStart).toHaveBeenCalledTimes(2);
    expect(stepStart).toHaveBeenNthCalledWith(1, 'mcp_github(list_issues)');
    expect(stepStart).toHaveBeenNthCalledWith(2, 'mcp_file(save_text_to_file)');
  });

  it('runs summary step when summary prompt is provided', async () => {
    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () =>
          JSON.stringify({
            result: {
              content: [
                {
                  type: 'text',
                  text: '{"issues":[{"id":1,"title":"bug"}]}',
                },
              ],
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () =>
          JSON.stringify({
            result: {
              structuredContent: {
                summary: 'theme: auth\nКоличество: 1',
              },
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () =>
          JSON.stringify({
            result: {
              structuredContent: {
                downloadUrl: 'http://localhost:3001/downloads/openclaw_openclaw_issues.txt',
              },
            },
          }),
      });

    const stepStart = vi.fn();
    const text = await resolveMcpPipelineAssistantText(
      '{"type":"mcp","method":"pipeline","value":"repo_issue_report","setting":{"owner":"openclaw","repo":"openclaw"}}',
      undefined,
      { onStepStart: stepStart, summaryPrompt: 'Сделай суммаризацию по theme' },
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(stepStart).toHaveBeenCalledTimes(3);
    expect(stepStart).toHaveBeenNthCalledWith(2, 'mcp_summary(summary_json)');

    const [summaryUrl, summaryInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(summaryUrl).toBe('http://localhost:3001/mcp/llm/tools/summary_json/invoke');
    expect(String(summaryInit.body)).toContain('"prompt":"Сделай суммаризацию по theme"');

    const [fileUrl, fileInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(fileUrl).toBe('http://localhost:3001/mcp/file-tools/tools/save_text_to_file/invoke');
    expect(String(fileInit.body)).toContain('theme: auth');
    expect(text).toContain('Отчет по issue сформирован.');
  });

  it('stops pipeline and reports failing step', async () => {
    localStorage.setItem(
      'mcp_github_settings_v1',
      JSON.stringify({
        enabled: true,
        baseUrl: 'http://localhost:3001/mcp',
      }),
    );

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server error',
      text: async () => JSON.stringify({ error: 'boom' }),
    });

    const text = await resolveMcpPipelineAssistantText(
      '{"type":"mcp","method":"pipeline","value":"repo_issue_report","setting":{"owner":"openclaw","repo":"openclaw"}}',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(text).toContain('Не удалось выполнить pipeline repo_issue_report:');
    expect(text).toContain('Ошибка шага mcp_github(list_issues):');
  });
});
