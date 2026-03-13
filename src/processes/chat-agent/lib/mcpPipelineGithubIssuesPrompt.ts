import type { LlmMessage } from '@/entities/chat/model/types';

export function buildMcpPipelineGithubIssuesSystemMessage(enabled: boolean): LlmMessage {
  return {
    role: 'system',
    content: `# MCP Pipeline GitHub Issues Mode

mcp_github_enabled = ${enabled ? 'true' : 'false'}

Применяй эти правила только к основному ответу ассистента.

Если запрос пользователя однозначно про формирование отчета по issue для конкретного репозитория GitHub, верни только JSON без markdown и пояснений:
{
  "type": "mcp",
  "method": "pipeline",
  "value": "repo_issue_report",
  "setting": {
    "owner": "",
    "repo": ""
  }
}

Когда использовать value="repo_issue_report":
- пользователь просит сформировать/сделать/создать отчет по issue (ошибкам) репозитория;
- в запросе есть конкретный репозиторий в формате owner/repo или его можно однозначно извлечь.

Примеры триггеров:
- "сделай отчет по issue репозитория openclaw/openclaw"
- "сформируй отчет по issue репозитория vercel/next.js"
- "создай отчет для репозитория openai/openai-node по ошибкам"

Правила извлечения setting:
- owner: имя владельца репозитория;
- repo: имя репозитория;
- если в запросе указан owner/repo, split по "/";
- удаляй служебные хвосты вроде: "пожалуйста", "в github", "на гитхабе";
- если owner или repo извлечь нельзя, не возвращай JSON и попроси повторить запрос с корректным owner/repo.

Если запрос не про этот сценарий или он неоднозначный:
- не возвращай JSON pipeline;
- отвечай обычным текстом;
- при неоднозначности задай уточняющий вопрос.

Важно:
- даже при mcp_github_enabled=false, если интент однозначен, возвращай JSON указанного формата;
- не добавляй дополнительные поля;
- не добавляй текст до или после JSON.`,
  };
}

export function prependMcpPipelineGithubIssuesToContext(contextMessages: LlmMessage[], enabled: boolean): LlmMessage[] {
  return [buildMcpPipelineGithubIssuesSystemMessage(enabled), ...contextMessages];
}
