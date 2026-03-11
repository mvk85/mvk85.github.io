import type { LlmMessage } from '@/entities/chat/model/types';
import { loadMcpGithubSettings } from '@/processes/chat-agent/lib/mcpGithubSettings';

export function loadMcpGithubEnabled(): boolean {
  return loadMcpGithubSettings().enabled;
}

export function buildMcpGithubSystemMessage(enabled: boolean): LlmMessage {
  return {
    role: 'system',
    content: `# MCP GitHub Serve Mode

mcp_github_enabled = ${enabled ? 'true' : 'false'}

Применяй эти правила только к основному ответу ассистента.

Если запрос пользователя однозначно про GitHub-интент, верни только JSON без markdown и пояснений:
{
  "type": "mcp",
  "method": "github",
  "value": "info | my_repo_list | search_repo",
  "setting": {
    "enable": ${enabled ? 'true' : 'false'},
    "query": ""
  }
}

Интенты:
- value="info": вопрос о возможности/доступе/умении работать с GitHub.
  Примеры: "ты можешь работать github", "ты можешь изменять github", "что ты можешь делать с github", "что ты можешь делать c github".
- value="my_repo_list": просьба вывести список репозиториев пользователя.
- value="search_repo": просьба найти репозиторий по имени (имя непустое, минимум одно слово; положи его в setting.query).

Правила для value="search_repo":
- Если пользователь просит "найти/поискать/вывести репозиторий" в GitHub, это считается search_repo.
- Извлеки поисковый запрос из текста пользователя в setting.query.
- Удаляй служебные слова и хвосты вроде: "на гитхабе", "в github", "мне", "пожалуйста".
- Если после извлечения осталась непустая строка (минимум одно слово), верни JSON с value="search_repo".
- Пример: "найди мне репозиторий backend на гитхабе" -> setting.query = "backend".
- Пример: "найди репозиторий react router в github" -> setting.query = "react router".
- Только если нельзя извлечь ни одного слова для query, не возвращай JSON и задай уточнение.

Если запрос не GitHub-сценарий или сценарий неоднозначен:
- не возвращай JSON в формате mcp;
- отвечай обычным текстом;
- при неоднозначности задай уточняющий вопрос.

Важно:
- даже при mcp_github_enabled=false, если GitHub-интент однозначен, верни JSON указанного формата;
- для запросов про возможности/доступ/умение работать с GitHub (info) всегда возвращай JSON value="info", даже если mcp_github_enabled=false;
- не добавляй дополнительные поля;
- не добавляй текст до или после JSON.`,
  };
}

export function prependMcpGithubToContext(contextMessages: LlmMessage[], enabled: boolean): LlmMessage[] {
  return [buildMcpGithubSystemMessage(enabled), ...contextMessages];
}
