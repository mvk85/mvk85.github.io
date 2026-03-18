# RAG Flow: внедрение контекста в обычный chat-flow (UI + API + Store)

Контекст: в проекте уже реализованы загрузка файлов в RAG и получение списка индексов.  
Нужно внедрить применение RAG-контекста при обычной отправке сообщения в чат, если RAG включен в настройках агента.

## Цель

Перед отправкой вопроса пользователя в LLM:
1. получить релевантные чанки из RAG;
2. отфильтровать по качеству (`minScore`);
3. приложить к запросу в LLM только валидный контекст;
4. при ошибках RAG не ломать чат и делать обычный LLM-запрос;
5. показать источники в UI отдельным структурированным блоком.

## Зафиксированные продуктовые решения

1. Хранение настроек RAG глобально (не per-chat).
2. Если не выбран ни один индекс, retrieval не выполнять.
3. `minScore` хранить в том же ключе настроек RAG.
4. `minScore` в UI: диапазон `0..1`, default `0.5`, helper: рекомендуемый диапазон `0.35..0.5`.
5. `topK` фиксировать на `8` (default и фактическое значение запроса).
6. Основной retrieval: `POST /rag/retrieve/multi`.
7. Fallback: при любой ошибке `retrieve/multi` запускать `POST /rag/retrieve` по каждому индексу, затем merge + sort + global topK на клиенте.
8. При отсутствии релевантных чанков не показывать сообщение в чате; в `console` писать только при ошибках RAG-flow.
9. Источники добавлять в UI вручную (не полагаться на генерацию LLM).
10. RAG-warning показывать под чатом, скрывать при следующем успешном запросе или автоматически через `10` секунд.
11. RAG применять только в обычном `chat-flow` (не task-flow, не scheduler, не MCP pipeline).
12. Без костылей: расширить модель сообщений/состояния под источники, не парсить их из текста.

## Контракты backend (подтверждено в ../backend)

### POST `/rag/retrieve/multi`
Request:
```json
{
  "indexIds": ["factory-...", "patterns-..."],
  "query": "Что такое фабричный метод?",
  "topK": 8
}
```

Response (ключевые поля):
```json
{
  "indexIds": ["..."],
  "query": "...",
  "topK": 8,
  "searchedIndexIds": ["..."],
  "missingIndexIds": ["..."],
  "matches": [
    {
      "indexId": "...",
      "score": 0.8532,
      "text": "...",
      "metadata": {
        "source": "local-file",
        "file": "...",
        "title": "...",
        "section": "...",
        "chunk_id": "...",
        "strategy": "structured",
        "token_count": 144
      }
    }
  ]
}
```

### POST `/rag/retrieve` (fallback)
Request:
```json
{
  "indexId": "...",
  "query": "...",
  "topK": 8
}
```

Response:
```json
{
  "indexId": "...",
  "query": "...",
  "topK": 8,
  "matches": [
    {
      "score": 0.81,
      "text": "...",
      "metadata": {
        "file": "...",
        "section": "...",
        "chunk_id": "..."
      }
    }
  ]
}
```

Примечание: fallback должен использовать доработанный backend-контракт, где `matches` уже содержат `indexId`.

## Архитектурный план по слоям

### 1) Shared API layer (`src/shared/api/ragApi.ts`)

Добавить типы и методы:
- `retrieveMulti(baseUrl, body, options?)`
- `retrieve(baseUrl, body, options?)`

Добавить нормализацию response-типов:
- `RagRetrieveMatch`
- `RagRetrieveMultiResponse`
- `RagRetrieveResponse`
- `RagChunkMetadata`

Требования:
- поддержать `AbortSignal`;
- не дублировать URL-логику;
- единообразная обработка ошибок через уже принятый подход.

### 2) Settings persistence (`src/processes/chat-agent/lib/ragSettings.ts`)

Расширить `RagSettings`:
- `enabled: boolean`
- `baseUrl: string`
- `selectedIndexIds: string[]`
- `minScore: number` (default `0.5`)
- `topK: number` (фиксировать `8`)

Правила нормализации:
- `minScore` clamp в `0..1`;
- `topK` приводить к `8` независимо от некорректного legacy-значения;
- `selectedIndexIds` очищать от пустых/дубликатов.

### 3) Domain model (chat message + state)

Расширить модель сообщения, чтобы хранить источники отдельно от текста:
- в `ChatMessage` добавить опциональное поле `rag?: { ... }` или эквивалентный typed-блок;
- хранить данные источников у ассистентского сообщения, к которому относится ответ.

Рекомендуемая структура:
- `rag.used: boolean`
- `rag.sources: Array<{ file; section; chunkId; indexId; score?; title?; strategy? }>`

Дополнительно в store-state:
- `ragWarningMessage: string | null` (для вывода под чатом);
- механика авто-сброса warning через `10` секунд.

### 4) Retrieval orchestration (store layer)

Точка интеграции: обычная ветка `sendUserMessage` перед финальным LLM-вызовом.

Алгоритм:
1. Загрузить `ragSettings`.
2. Если `enabled=false` -> обычный flow.
3. Если `enabled=true`, но `selectedIndexIds` пуст -> обычный flow (без retrieval).
4. Выполнить `retrieve/multi` (`topK=8`, `query=текущий user input`).
5. Если `retrieve/multi` упал -> fallback:
   - параллельно вызвать `retrieve` по каждому `indexId`;
   - добавить `indexId` в каждый match;
   - merge, sort by `score desc`, `slice(0, topK)`.
6. Отфильтровать:
   - `filtered = matches.filter(m => m.score >= minScore)`.
7. Если `filtered` пуст:
   - `console.info/warn` с диагностикой;
   - отправлять в LLM только обычный контекст.
8. Если `filtered` не пуст:
   - собрать RAG context block;
   - добавить отдельным `system`-сообщением в payload LLM;
   - сохранить источники в ассистентское сообщение.
9. Если `missingIndexIds` не пуст:
   - выставить `ragWarningMessage` (под чатом), но не прерывать flow.
10. Любая ошибка RAG-flow:
   - не падать;
   - продолжать обычный LLM-запрос;
   - показать `ragWarningMessage`.

### 5) Формат системного RAG-контекста для LLM

Добавлять отдельный `system` message перед пользовательским вопросом.

Шаблон:
```text
Используй только этот контекст как внешнюю базу знаний. Если данных недостаточно, явно скажи об этом.
Контекст RAG:
[1] indexId=...; file=...; section=...; chunk_id=...; score=...
<text chunk>

[2] ...
```

Ограничения:
- использовать только отфильтрованные чанки;
- ограничить число чанков `topK=8`;
- при необходимости обрезать слишком длинные тексты чанков до разумного лимита, чтобы не раздувать токены.

### 6) UI: Agent settings drawer (RAG tab)

Добавить элементы:
1. Multi-select доступных индексов.
2. Кнопка/чекбокс "Выбрать все".
3. `minScore` (`0..1`, step `0.01`, helper про `0.35..0.5`).
4. `topK` (фиксирован `8`, можно read-only с пояснением).

Поведение:
- список индексов грузится как сейчас;
- выбор индексов и параметры сразу persist в `rag_settings_v1`;
- при удалении индекса из списка удалять его и из `selectedIndexIds`.

### 7) UI: отображение warning и источников

Под чатом:
- отдельный `Alert severity="warning"` для `ragWarningMessage`.
- авто-скрытие через 10 секунд.
- сброс при следующем успешном запросе.

В сообщении ассистента:
- если у сообщения есть `rag.sources.length > 0`, показать блок `Источники`.
- формат key-value, визуально отделенный от основного текста.

Пример строки источника:
- `file: architecture.md | section: auth | chunk_id: ... | indexId: ...`

## Тестовый план

1. Unit: `ragSettings` normalization и backward compatibility.
2. Unit: merge/sort/filter для fallback retrieval.
3. Unit: формирование RAG system message.
4. Store test:
- RAG disabled -> retrieval не вызывается.
- RAG enabled + empty indexIds -> retrieval не вызывается.
- `multi` success + low scores -> контекст не добавляется.
- `multi` failure + fallback success -> контекст добавляется.
- RAG error -> LLM-call выполняется, warning отображается.
5. UI test:
- выбор индексов сохраняется;
- warning под чатом показывается и скрывается по таймеру;
- источники рендерятся у ассистентского сообщения.

## Критерии готовности

1. Пользователь может выбрать несколько индексов или выбрать все.
2. Если индексы не выбраны, RAG retrieval не выполняется.
3. В UI есть `minScore` (`0..1`, default `0.5`) и `topK=8`.
4. На отправку запроса используется `retrieve/multi`, при ошибке — fallback `retrieve`.
5. Низкорелевантные чанки (`score < minScore`) не передаются в LLM.
6. При отсутствии релевантного контекста чат не падает и не показывает лишних сообщений.
7. При RAG-ошибках выполняется обычный LLM-запрос и отображается warning под чатом.
8. Источники выводятся в UI отдельным структурированным блоком, а не внутри сырого текста ответа.
9. Реализация выполнена чисто по слоям, без парсинга источников из текста.

## Ограничение на текущий шаг

Это только план-промпт.  
К реализации кода не приступать до явного апрува.
