import type { ChatTaskId, FrontendPromptTaskState, TaskPlanningQuestion } from '@/entities/chat/model/types';

export type ChatTaskOption = {
  id: ChatTaskId;
  label: string;
};

export const CHAT_TASK_OPTIONS: ChatTaskOption[] = [
  { id: 'none', label: 'нет задачи' },
  { id: 'frontend_app_prompt', label: 'сделать промпт для создания фронтенд приложения' },
];

export const FRONTEND_PROMPT_TASK_QUESTIONS: TaskPlanningQuestion[] = [
  { id: 'q1', text: 'Какой тип фронтенд приложения создаем (лендинг, SaaS, админка, маркетплейс и т.д.)?' },
  { id: 'q2', text: 'Какой основной стек обязателен (React/Vue/Svelte, TypeScript, роутинг, состояние)?' },
  { id: 'q3', text: 'Нужна ли UI-библиотека или дизайн-система (MUI, Ant, Tailwind, custom)?' },
  { id: 'q4', text: 'Какие требования к API-интеграции (REST/GraphQL, auth, обработка ошибок, retries)?' },
  { id: 'q5', text: 'Какие нефункциональные требования важны (производительность, accessibility, SEO, i18n)?' },
  { id: 'q6', text: 'Какие требования к качеству кода и тестам (unit, integration, e2e, coverage, lint/format)?' },
  { id: 'q7', text: 'Нужны ли CI/CD, окружения и стратегия деплоя (preview/stage/prod)?' },
  { id: 'q8', text: 'Какие ограничения и критерии приемки у результата (сроки, команды, готовые модули, Definition of Done)?' },
];

export function isValidChatTaskId(value: unknown): value is ChatTaskId {
  return value === 'none' || value === 'frontend_app_prompt';
}

export function isTaskEnabled(taskId: ChatTaskId): taskId is Exclude<ChatTaskId, 'none'> {
  return taskId !== 'none';
}

export function createFrontendPromptInitialTaskState(nowIso: string = new Date().toISOString()): FrontendPromptTaskState {
  return {
    taskId: 'frontend_app_prompt',
    stage: 'planning',
    currentStep: 'Сбор вводных по новому фронтенд приложению.',
    expectedAction: 'Ответьте на все вопросы planning (можно частями в нескольких сообщениях).',
    planningQuestions: FRONTEND_PROMPT_TASK_QUESTIONS.map((question) => ({ ...question })),
    planningAnswers: {},
    lastGeneratedPrompt: null,
    validationResult: null,
    revisionRequest: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    version: 1,
  };
}
