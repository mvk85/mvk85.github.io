# Архитектура приложения (Шаг 1, обновлено)

## 1. Цель
Собрать одностраничное SPA-приложение на React (без backend), которое:
- показывает форму с полем ввода Telegram login;
- отправляет `POST` запрос в OpenAI Proxy API по кнопке `Поиск`;
- выводит текст ответа модели при успехе;
- выводит текст ошибки при неуспехе;
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

### 3.2 Заголовки
- `Content-Type: application/json`
- `Authorization: Bearer <TOKEN>`

Токен хранится в `.env` (например, `VITE_OPENAI_API_KEY`) и подставляется при сборке.

### 3.3 Тело запроса
```json
{
  "model": "gpt-5.1",
  "messages": [
    {
      "role": "user",
      "content": "Привет!"
    }
  ]
}
```

В нашем приложении `content` формируется из введенного Telegram login, например:
`Найди информацию по telegram login: <логин>`

### 3.4 Формат ответа
Из ответа используется поле:
- `choices[0].message.content`

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
- поле ввода `Telegram login` (`TextField`);
- кнопка `Поиск` (`Button`, на мобильном full width);
- область результата (`Alert`/`Paper` + `Typography`).

Состояния UI:
- `idle` (пусто/подсказка);
- `loading` (кнопка disabled + `CircularProgress`);
- `success` (показываем `choices[0].message.content`);
- `error` (показываем текст ошибки).

Адаптивность:
- сначала верстка под `320px+`;
- на десктопе ограничиваем ширину формы (`maxWidth` около `560px`) и центрируем.

## 7. Управление состоянием
На первом этапе достаточно локального состояния в feature-хуке (`useSubmitSearch`):
- `telegramLogin: string`
- `status: 'idle' | 'loading' | 'success' | 'error'`
- `resultText: string | null`
- `errorMessage: string | null`

Сценарий submit:
1. Валидация ввода (не пустой логин).
2. Переход в `loading`, очистка старых данных.
3. Вызов `chatApi.createCompletion`.
4. Успех: извлечение `choices[0].message.content` и показ результата.
5. Ошибка: нормализация и показ текста ошибки.

## 8. Конфигурация env
Пример `.env`:
```env
VITE_OPENAI_API_URL=https://openai.api.proxyapi.ru/v1/chat/completions
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-5.1
```

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
- По клику `Поиск` уходит `POST` запрос в указанный endpoint.
- При успехе выводится `choices[0].message.content`.
- При ошибке выводится понятный текст.
- Проект собирается в статику и открывается на GitHub Pages.

## 11. Следующий шаг
1. Инициализировать проект `Vite + React + TypeScript`.
2. Развернуть FSD-структуру каталогов.
3. Подключить MUI и собрать экран.
4. Реализовать API-слой и обработку состояний.
5. Настроить deploy на GitHub Pages.
# mvk85.github.io
