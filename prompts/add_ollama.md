# Добавление локальных моделей Ollama + опция запроса баланса

Контекст: в приложении уже есть chat-flow c cloud LLM через `openAiProxyChatApi`, подсчет стоимости по разнице баланса и статистика токенов/стоимости по чату.

Нужно добавить поддержку локальных моделей Ollama и сделать поведение баланса управляемым из настроек агента.

## Зафиксированные продуктовые решения

1. Добавить локальные модели в список выбора:
- `qwen2.5:0.5b`
- `qwen2.5:1.5b`
- `qwen2.5:3b`

2. Если выбрана локальная модель `qwen2.5:*`, все LLM-запросы идут только в Ollama, без fallback на cloud.

3. Ollama endpoint использовать строго `/api/generate`.

4. Добавить глобальную настройку агента (не per-chat):
- `Запрашивать баланс`
- default: `false`

5. Если `Запрашивать баланс = false`:
- вообще не делать запросы баланса;
- не считать стоимость;
- не показывать в UI строку стоимости.

6. Для локальных моделей авторизационный токен не нужен и не должен отправляться.

7. Для Ollama URL использовать env-переменную и сразу прописать нужный адрес в `.env.example`.

## Контракт Ollama (обязательный)

### Request
`POST http://localhost:11434/api/generate`

Headers:
- `Content-Type: application/json`

Body:
```json
{
  "model": "qwen2.5:0.5b",
  "prompt": "Привет!",
  "stream": false
}
```

### Response (пример)
```json
{
  "model":"qwen2.5:0.5b",
  "created_at":"2026-03-24T18:17:44.572706132Z",
  "response":"Hello! How can I assist you today?",
  "done":true,
  "done_reason":"stop",
  "context":[151644,8948,198,2610,525,1207,16948,11,3465,553,54364,14817,13,1446,525,264,10950,17847,13,151645,198,151644,872,198,53645,26991,8178,0,151645,198,151644,77091,198,9707,0,2585,646,358,7789,498,3351,30],
  "total_duration":1817898042,
  "load_duration":1426425792,
  "prompt_eval_count":33,
  "prompt_eval_duration":208243208,
  "eval_count":10,
  "eval_duration":154021500
}
```

## Архитектурный план изменений

### 1) Модели (`src/shared/config/llmModels.ts`)

- Расширить `CHAT_MODEL_OPTIONS`, добавив:
  - `qwen2.5:0.5b`
  - `qwen2.5:1.5b`
  - `qwen2.5:3b`
- `ChatModel` должен включать эти значения.

### 2) Env (`src/shared/config/env.ts`, `.env.example`)

- Добавить переменную:
  - `VITE_OLLAMA_API_URL=http://localhost:11434/api/generate`
- Прочитать ее в `env.ts` с таким же default.
- Оставить текущие cloud-переменные без регресса.

### 3) Единый LLM API-слой

Создать новый слой, например `src/shared/api/llmApi.ts`, который выбирает провайдер по модели.

Требуемый публичный контракт:
- `createChatCompletion(payload, options?) => Promise<ChatCompletionResponse>`
- `getBalance(options?) => Promise<number>` (для cloud сценария)

Правила маршрутизации:
- `qwen2.5:*` -> Ollama `/api/generate`
- остальные модели -> текущий cloud endpoint (`openAiProxyChatApi`)

Важно:
- для Ollama не отправлять `Authorization`;
- для cloud поведение оставить как сейчас.

### 4) Адаптер ответа Ollama -> ChatCompletionResponse проекта

Проект ожидает OpenAI-like формат (`choices[0].message.content`, `usage`).

Нужно преобразование:
- `choices[0].message.content` = `response`
- `model` = `model`
- `created` = unix timestamp (секунды, из `created_at`, при ошибке fallback на `Date.now()`)
- `object` = `'chat.completion'`
- `id` = сгенерировать стабильный id (`ollama_${timestamp}` или аналог)
- `choices[0].finish_reason` = `done_reason ?? null`
- `choices[0].index` = `0`
- `choices[0].message.role` = `'assistant'`
- `usage.prompt_tokens` = `prompt_eval_count ?? 0`
- `usage.completion_tokens` = `eval_count ?? 0`
- `usage.total_tokens` = сумма двух значений

Дополнительно:
- Если `response` пустой/нестроковый, бросать понятную ошибку как и в cloud path.
- Если token-поля отсутствуют, использовать `0`, не ломая общий flow.

### 5) Формирование prompt для Ollama

В проекте текущий payload использует `messages`.
Для Ollama `/api/generate` нужно собрать `prompt: string` из `messages`.

Сделать детерминированный mapper:
- `system` -> префикс `System: ...`
- `user` -> `User: ...`
- `assistant` -> `Assistant: ...`
- финал: `Assistant:` как маркер ожидаемого ответа

Сохранить максимально простой и стабильный формат, чтобы не ломать текущие контекстные стратегии.

### 6) Настройка агента: `Запрашивать баланс`

Добавить новый storage по аналогии с `ragSettings`/`mcpGithubSettings`, например:
- файл: `src/processes/chat-agent/lib/chatAgentSettings.ts`
- key: `chat_agent_settings_v1`
- тип:
  - `requestBalance: boolean`
- default:
  - `requestBalance: false`

### 7) UI: Drawer “Настройка агента”

В `SearchPage.tsx`:
- добавить вкладку `LLM` (или секцию в существующей вкладке) с переключателем:
  - label: `Запрашивать баланс`
- значение хранить в новом settings storage.
- настройка глобальная (на весь агент), не per-chat.

### 8) Store-flow (`src/processes/chat-agent/model/store.ts`)

Переключить LLM-вызовы с `openAiProxyChatApi.createChatCompletion` на новый `llmApi.createChatCompletion`.

Условная логика баланса:
- если `requestBalance=false`:
  - не делать pre-request `getBalance`;
  - не делать post-request `getBalance`;
  - `requestCost` считать `0`;
  - не увеличивать `totalCost`;
  - не вызывать `refreshInitialBalance`.

- если `requestBalance=true`:
  - оставить текущий сценарий расчета стоимости по разнице баланса.

Точки, где важно не забыть условие:
- `refreshInitialBalance`
- основная ветка `sendUserMessage` (task-flow и обычный flow)
- `clearChat` (post-refresh balance)

### 9) Derived + UI статистика

Нужно, чтобы UI знал, отображать стоимость или нет.

Рекомендуемый вариант:
- добавить в derived поле `shouldShowCost` (зависит от `requestBalance`).
- в статистике `SearchPage`:
  - оставить токены и модель всегда;
  - строку `Общая стоимость` показывать только если `shouldShowCost=true`.

### 10) Тесты

Обновить и/или добавить тесты:

1. `requestBalance=false`:
- `getBalance` не вызывается вообще;
- запросы к LLM продолжают работать.

2. Выбор `qwen2.5:0.5b`:
- используется Ollama path;
- нет `Authorization` заголовка;
- ответ маппится в `ChatCompletionResponse` корректно.

3. UI статистики:
- стоимость скрыта при `requestBalance=false`.

4. Регрессия:
- существующие `chat-agent-store` тесты остаются зелеными (при включенном балансе поведение старого сценария не ломается).

## Ограничения и правила

1. Не менять текущую бизнес-логику MCP/RAG/task-flow/history сверх необходимого.
2. Не добавлять fallback cloud при ошибке Ollama.
3. Не требовать токен для локальных моделей.
4. Не ломать типы `ChatCompletionResponse` и существующие extractors (`extractAssistantText`, `extractUsage`).
5. Следовать FSD-структуре проекта.

## Критерии готовности

1. В выпадающем списке доступны `qwen2.5:0.5b`, `qwen2.5:1.5b`, `qwen2.5:3b`.
2. При выборе `qwen2.5:*` запросы уходят только в `VITE_OLLAMA_API_URL` (`/api/generate`) без auth.
3. При `Запрашивать баланс=false` нет balance-запросов и не отображается стоимость.
4. При `Запрашивать баланс=true` сохраняется текущая логика стоимости.
5. Тесты проходят.
