# Архитектура приложения (Сравнение моделей)

## 1. Цель
Собрать одностраничное SPA-приложение на React (без backend), которое:
- показывает поле для ввода многострочного JSON тела запроса;
- по кнопке `Отправить` выполняет последовательные запросы к 3 моделям: `gpt-3.5-turbo`, `gpt-4o`, `gpt-5.2`;
- перед стартом запрашивает текущий баланс (в рублях), а после каждого запроса дожидается обновления баланса (poll раз в 500ms, до 5 попыток);
- выводит таблицу сравнения (стоимость запроса, время ответа, токены из `usage`);
- выводит текст ответа каждой модели ниже таблицы;
- корректно работает на мобильных и десктопных устройствах (mobile-first);
- собирается в статические файлы и деплоится на GitHub Pages.

## 2. Технологический стек
- `React` + `TypeScript`
- `Material UI (MUI)` для UI
- `fetch` для HTTP
- `Vite` для сборки SPA
- `GitHub Pages` (deploy через `gh-pages` или GitHub Actions)
- Архитектурный подход: `FSD (Feature-Sliced Design)`

## 3. API контракт
### 3.1 Endpoint
`POST https://openai.api.proxyapi.ru/v1/chat/completions`

### 3.1.1 Баланс (ProxyAPI)
`GET https://api.proxyapi.ru/proxyapi/balance`

### 3.2 Заголовки
- `Content-Type: application/json`
- `Authorization: Bearer <TOKEN>`

Токен хранится в `.env` (например, `VITE_OPENAI_API_KEY`) и подставляется при сборке.

### 3.3 Тело запроса
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Привет!"
    }
  ]
}
```

В UI пользователь вводит JSON. Поле `model` будет перезаписано на каждую из 3 моделей.

### 3.4 Формат ответа
Из ответа используется поле:
- `choices[0].message.content`

Для таблицы также используется `usage`:
```json
{
  "usage": {
    "completion_tokens": 10,
    "prompt_tokens": 9,
    "total_tokens": 19
  }
}
```

Если поле отсутствует или пустое, считаем это ошибкой парсинга ответа.

## 4. Безопасность и ограничения
Важно: в SPA без backend секретный ключ нельзя сделать полностью секретным.  
Любая переменная из `.env`, попавшая в frontend-сборку, потенциально доступна пользователю через devtools/network.

Вывод:
- Для демо на GitHub Pages можно использовать ключ с жесткими лимитами и отдельным аккаунтом/проектом.
- Для production нужен backend/proxy, который скрывает реальный ключ.

## 5. FSD структура проекта
Предлагаемая структура:
```txt
src/
  app/
    providers/
      theme/
        ui/ThemeProvider.tsx
    styles/
      index.css
    App.tsx
    main.tsx
  pages/
    search-page/
      ui/SearchPage.tsx
  widgets/
    search-form/
      ui/SearchForm.tsx
    result-panel/
      ui/ResultPanel.tsx
  features/
    submit-search/
      model/useSubmitSearch.ts
  entities/
    chat-response/
      model/types.ts
      lib/mapResponse.ts
  shared/
    api/
      client.ts
      chatApi.ts
    config/
      env.ts
    lib/
      errors.ts
    ui/
      PageContainer.tsx
```

## 6. Экран и UX (Mobile First)
Один экран:
- `TextField` с многострочным JSON тела запроса;
- кнопка `Отправить` (на мобильном full width);
- область результата: прогресс/ошибка, таблица сравнения, ответы моделей.

Состояния UI:
- `idle` (пусто/подсказка);
- `loading` (кнопка disabled + `CircularProgress`);
- `success` (показываем `choices[0].message.content`);
- `error` (показываем текст ошибки).

Адаптивность:
- сначала верстка под `320px+`;
- на десктопе ограничиваем ширину формы (`maxWidth` около `560px`) и центрируем.

## 7. Управление состоянием
Достаточно локального состояния в feature-хуке (`useCompareModels`):
- `requestBodyText: string`
- `status: 'idle' | 'loading' | 'success' | 'error'`
- `rows: Array<{ model, costRub, responseTimeSec, promptTokens, completionTokens, totalTokens, responseText }>`
- `initialBalanceRub: number | null`
- `errorMessage/progressMessage`

## 8. Конфигурация env
Пример `.env`:
```env
VITE_OPENAI_API_URL=https://openai.api.proxyapi.ru/v1/chat/completions
VITE_OPENAI_API_KEY=sk-...
VITE_PROXYAPI_API_KEY=sk-...
VITE_PROXYAPI_BALANCE_URL=https://api.proxyapi.ru/proxyapi/balance
```

`VITE_OPENAI_MODEL` опционален (нужен только для старого `chatApi`, если он используется).

Файл `.env` должен быть в `.gitignore`.  
Для GitHub Pages ключ передается через переменные окружения в CI (или локально перед билдом).

## 9. Сборка и деплой на GitHub Pages
Требования для SPA на Pages:
- Vite `base: '/<repo-name>/'` в `vite.config.ts` (для project pages).
- Сценарий деплоя:
  - сборка `npm run build`;
  - публикация содержимого `dist/` на Pages.

Варианты:
- `gh-pages` пакет (локальный deploy);
- GitHub Actions (предпочтительно, без ручного шага).

## 10. Критерии готовности
- Форма и результат корректно отображаются на mobile/desktop.
- По клику `Отправить` последовательно выполняются запросы к 3 моделям.
- После каждого запроса баланс дожидается обновления (до 5 попыток раз в 500ms), стоимость считается по разнице.
- При успехе строится таблица и выводятся ответы.
- При ошибке выводится понятный текст (включая ошибку баланса).
- Проект собирается в статику и открывается на GitHub Pages.

## 11. Следующий шаг
1. Инициализировать проект `Vite + React + TypeScript`.
2. Развернуть FSD-структуру каталогов.
3. Подключить MUI и собрать экран.
4. Реализовать API-слой и обработку состояний.
5. Настроить deploy на GitHub Pages.
# mvk85.github.io
