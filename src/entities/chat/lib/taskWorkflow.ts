import { assertTaskTransition } from '@/entities/chat/lib/taskStateMachine';
import type { FrontendPromptTaskState, LlmMessage, TaskPlanningQuestion, TaskValidationResult } from '@/entities/chat/model/types';
import type { ChatCompletionUsage } from '@/entities/chat-response/model/types';

type TaskLlmCall = (messages: LlmMessage[]) => Promise<{ text: string; usage: ChatCompletionUsage }>;

export type TaskTurnInput = {
  chatId: string;
  taskState: FrontendPromptTaskState;
  userInput: string;
  llmCall: TaskLlmCall;
};

export type TaskTurnResult = {
  taskState: FrontendPromptTaskState;
  assistantText: string;
  usage: ChatCompletionUsage;
};

const CONTINUE_PATTERN = /(дальше|перейти|продолж|skip|next)/i;
const SATISFIED_PATTERN = /(устраивает|подходит|ок|ok|согласен|без правок|завершаем|готово)/i;

function createEmptyUsage(): ChatCompletionUsage {
  return {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };
}

function addUsage(left: ChatCompletionUsage, right: ChatCompletionUsage): ChatCompletionUsage {
  return {
    prompt_tokens: left.prompt_tokens + right.prompt_tokens,
    completion_tokens: left.completion_tokens + right.completion_tokens,
    total_tokens: left.total_tokens + right.total_tokens,
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const normalized =
    trimmed.startsWith('```') && trimmed.endsWith('```')
      ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      : trimmed;
  return JSON.parse(normalized);
}

function formatTaskMessage(stage: string, currentStep: string, expectedAction: string, body: string): string {
  return [`Этап задачи: ${stage}`, `Текущий шаг: ${currentStep}`, `Ожидаемое действие: ${expectedAction}`, '', body].join('\n');
}

function getMissingQuestionIds(state: FrontendPromptTaskState): string[] {
  return state.planningQuestions
    .filter((question) => !state.planningAnswers[question.id] || state.planningAnswers[question.id].trim().length === 0)
    .map((question) => question.id);
}

function getQuestionById(questions: TaskPlanningQuestion[], id: string): TaskPlanningQuestion | undefined {
  return questions.find((question) => question.id === id);
}

function formatQuestionsChecklist(state: FrontendPromptTaskState): string {
  return state.planningQuestions
    .map((question, index) => {
      const answer = state.planningAnswers[question.id];
      return `${index + 1}. [${answer ? 'x' : ' '}] ${question.text}${answer ? `\n   Ответ: ${answer}` : ''}`;
    })
    .join('\n');
}

function mergePlanningAnswers(
  state: FrontendPromptTaskState,
  incomingAnswers: Record<string, string>,
  nowIso: string = new Date().toISOString(),
): FrontendPromptTaskState {
  if (Object.keys(incomingAnswers).length === 0) {
    return state;
  }

  return {
    ...state,
    planningAnswers: {
      ...state.planningAnswers,
      ...incomingAnswers,
    },
    updatedAt: nowIso,
    version: state.version + 1,
  };
}

function transitionStage(
  chatId: string,
  state: FrontendPromptTaskState,
  toStage: FrontendPromptTaskState['stage'],
  currentStep: string,
  expectedAction: string,
  event: string,
  nowIso: string = new Date().toISOString(),
): FrontendPromptTaskState {
  assertTaskTransition(state.stage, toStage);
  console.info(`[task-fsm] chat=${chatId} event=${event} transition=${state.stage}->${toStage}`);
  return {
    ...state,
    stage: toStage,
    currentStep,
    expectedAction,
    updatedAt: nowIso,
    version: state.version + 1,
  };
}

async function extractPlanningAnswers(
  state: FrontendPromptTaskState,
  userInput: string,
  llmCall: TaskLlmCall,
): Promise<{ answers: Record<string, string>; usage: ChatCompletionUsage }> {
  const fallback: { answers: Record<string, string>; usage: ChatCompletionUsage } = { answers: {}, usage: createEmptyUsage() };
  if (!userInput.trim()) {
    return fallback;
  }

  try {
    const { text, usage } = await llmCall([
      {
        role: 'system',
        content: `Ты извлекаешь ответы пользователя для набора вопросов.
Верни только JSON:
{
  "answers": {
    "q1": "ответ",
    "q2": "ответ"
  }
}
Добавляй только те вопросы, на которые в текущем сообщении есть явный ответ.
Не придумывай ответы.`,
      },
      {
        role: 'user',
        content: `Вопросы:\n${state.planningQuestions.map((question, index) => `${index + 1}. ${question.id}: ${question.text}`).join('\n')}\n\nУже собранные ответы:\n${JSON.stringify(
          state.planningAnswers,
          null,
          2,
        )}\n\nТекущее сообщение пользователя:\n${userInput}`,
      },
    ]);

    const parsed = extractJson(text) as { answers?: unknown };
    const rawAnswers = typeof parsed.answers === 'object' && parsed.answers !== null ? parsed.answers : {};
    const normalized = Object.entries(rawAnswers as Record<string, unknown>).reduce<Record<string, string>>((accumulator, [key, value]) => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        return accumulator;
      }

      if (!getQuestionById(state.planningQuestions, key)) {
        return accumulator;
      }

      accumulator[key] = value.trim();
      return accumulator;
    }, {});

    return {
      answers: normalized,
      usage,
    };
  } catch {
    return fallback;
  }
}

function extractAnswersByNumbering(state: FrontendPromptTaskState, userInput: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /(?:^|\n)\s*(\d{1,2})\s*[\).\:-]\s*(.+?)(?=\n\s*\d{1,2}\s*[\).\:-]|\s*$)/gs;

  for (const match of userInput.matchAll(regex)) {
    const questionNumber = Number(match[1]);
    const answerText = match[2]?.trim();
    if (!Number.isInteger(questionNumber) || questionNumber <= 0 || !answerText) {
      continue;
    }

    const question = state.planningQuestions[questionNumber - 1];
    if (!question) {
      continue;
    }

    result[question.id] = answerText;
  }

  return result;
}

function buildMissingQuestionsText(state: FrontendPromptTaskState, missingQuestionIds: string[]): string {
  return missingQuestionIds
    .map((questionId) => {
      const question = getQuestionById(state.planningQuestions, questionId);
      return question ? `- ${question.text}` : null;
    })
    .filter((line): line is string => Boolean(line))
    .join('\n');
}

function buildExecutionPrompt(state: FrontendPromptTaskState, revisionRequest: string | null): LlmMessage[] {
  const planningAnswers = state.planningQuestions
    .map((question, index) => `${index + 1}. ${question.text}\nОтвет: ${state.planningAnswers[question.id] ?? 'не указан'}`)
    .join('\n\n');

  const previousPrompt = state.lastGeneratedPrompt ? `\n\nПредыдущая версия промпта:\n${state.lastGeneratedPrompt}` : '';
  const validationContext = state.validationResult
    ? `\n\nПоследний review:\n${JSON.stringify(
        {
          status: state.validationResult.status,
          reviewSummary: state.validationResult.reviewSummary,
          issues: state.validationResult.issues,
          clarificationQuestions: state.validationResult.clarificationQuestions,
        },
        null,
        2,
      )}`
    : '';
  const revisionContext = revisionRequest ? `\n\nУточнения от пользователя для правок:\n${revisionRequest}` : '';

  return [
    {
      role: 'system',
      content: `Ты senior аналитик и senior frontend разработчик.
Сформируй высококачественный промпт для code assistant, который будет создавать фронтенд приложение.
Пиши строго на русском.
Промпт должен быть практичным и структурированным.
Обязательные разделы:
1) Цель проекта
2) Контекст и ограничения
3) Технологический стек
4) Архитектурные требования
5) Требования к качеству (тесты, линтеры, DX)
6) Нефункциональные требования
7) Критерии приемки
8) Формат ожидаемого результата от code assistant`,
    },
    {
      role: 'user',
      content: `Собранные ответы пользователя:\n${planningAnswers}${previousPrompt}${validationContext}${revisionContext}`,
    },
  ];
}

async function runValidation(
  generatedPrompt: string,
  llmCall: TaskLlmCall,
): Promise<{ result: TaskValidationResult; usage: ChatCompletionUsage }> {
  const fallbackResult: TaskValidationResult = {
    status: 'needs_revision',
    reviewSummary: 'Не удалось получить структурированный review, требуется ручное уточнение требований.',
    issues: ['Review вернулся в невалидном формате.'],
    clarificationQuestions: ['Какие правки вы хотите внести в итоговый промпт?'],
    reviewedAt: new Date().toISOString(),
  };

  try {
    const { text, usage } = await llmCall([
      {
        role: 'system',
        content: `Ты senior reviewer фронтенд промптов.
Проведи review промпта и верни только JSON:
{
  "status": "needs_revision" | "approved",
  "reviewSummary": "краткий вывод",
  "issues": ["список конкретных замечаний"],
  "clarificationQuestions": ["вопросы к пользователю для правок"]
}
Если замечаний нет, используй status=approved, issues=[] и clarificationQuestions=[].
Не добавляй markdown.`,
      },
      {
        role: 'user',
        content: `Проведи review этого промпта:\n\n${generatedPrompt}`,
      },
    ]);

    const parsed = extractJson(text) as Partial<TaskValidationResult> & { issues?: unknown; clarificationQuestions?: unknown };
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues.filter((issue): issue is string => typeof issue === 'string' && issue.trim().length > 0).map((issue) => issue.trim())
      : [];
    const clarificationQuestions = Array.isArray(parsed.clarificationQuestions)
      ? parsed.clarificationQuestions
          .filter((question): question is string => typeof question === 'string' && question.trim().length > 0)
          .map((question) => question.trim())
      : [];
    const status = parsed.status === 'approved' || (issues.length === 0 && clarificationQuestions.length === 0) ? 'approved' : 'needs_revision';

    return {
      result: {
        status,
        reviewSummary:
          typeof parsed.reviewSummary === 'string' && parsed.reviewSummary.trim().length > 0
            ? parsed.reviewSummary.trim()
            : status === 'approved'
              ? 'Существенных замечаний не найдено.'
              : 'Требуются правки перед финализацией.',
        issues,
        clarificationQuestions,
        reviewedAt: new Date().toISOString(),
      },
      usage,
    };
  } catch {
    return {
      result: fallbackResult,
      usage: createEmptyUsage(),
    };
  }
}

function buildValidationBody(generatedPrompt: string, validationResult: TaskValidationResult): string {
  const lines: string[] = [];
  lines.push('Черновик итогового промпта:');
  lines.push(generatedPrompt);
  lines.push('');
  lines.push(`Review: ${validationResult.reviewSummary}`);

  if (validationResult.issues.length > 0) {
    lines.push('');
    lines.push('Замечания:');
    for (const issue of validationResult.issues) {
      lines.push(`- ${issue}`);
    }
  } else {
    lines.push('');
    lines.push('Замечаний критического уровня не найдено.');
  }

  if (validationResult.clarificationQuestions.length > 0) {
    lines.push('');
    lines.push('Уточняющие вопросы для правок:');
    for (const question of validationResult.clarificationQuestions) {
      lines.push(`- ${question}`);
    }
  }

  lines.push('');
  lines.push('Если результат устраивает, напишите: "устраивает".');
  return lines.join('\n');
}

async function executeAndValidate(
  chatId: string,
  state: FrontendPromptTaskState,
  llmCall: TaskLlmCall,
  revisionRequest: string | null,
): Promise<TaskTurnResult> {
  const generation = await llmCall(buildExecutionPrompt(state, revisionRequest));
  const generatedPrompt = generation.text.trim();
  const stageAfterExecution = transitionStage(
    chatId,
    state,
    'validation',
    'Автоматическая валидация сгенерированного промпта и сбор обратной связи.',
    'Подтвердите результат или ответьте на уточняющие вопросы для правок.',
    'execution_completed',
  );

  const review = await runValidation(generatedPrompt, llmCall);
  const nextState: FrontendPromptTaskState = {
    ...stageAfterExecution,
    validationResult: review.result,
    lastGeneratedPrompt: generatedPrompt,
    revisionRequest,
    updatedAt: new Date().toISOString(),
    version: stageAfterExecution.version + 1,
  };

  const expectedAction =
    review.result.status === 'approved'
      ? 'Если результат устраивает, напишите "устраивает", чтобы завершить задачу.'
      : 'Ответьте на уточняющие вопросы для правок или подтвердите "устраивает", если хотите завершить.';
  const normalizedState: FrontendPromptTaskState = {
    ...nextState,
    expectedAction,
    updatedAt: new Date().toISOString(),
    version: nextState.version + 1,
  };

  return {
    taskState: normalizedState,
    assistantText: formatTaskMessage(
      normalizedState.stage,
      normalizedState.currentStep,
      normalizedState.expectedAction,
      buildValidationBody(generatedPrompt, review.result),
    ),
    usage: addUsage(generation.usage, review.usage),
  };
}

export async function runFrontendPromptTaskTurn(input: TaskTurnInput): Promise<TaskTurnResult> {
  const normalizedUserInput = input.userInput.trim();

  if (input.taskState.stage === 'planning') {
    let nextState = input.taskState;
    let accumulatedUsage = createEmptyUsage();

    const extracted = await extractPlanningAnswers(nextState, normalizedUserInput, input.llmCall);
    const fromNumberedList = extractAnswersByNumbering(nextState, normalizedUserInput);
    const mergedIncomingAnswers: Record<string, string> = {
      ...extracted.answers,
      ...fromNumberedList,
    };

    nextState = mergePlanningAnswers(nextState, mergedIncomingAnswers);
    accumulatedUsage = addUsage(accumulatedUsage, extracted.usage);

    const missingQuestionIds = getMissingQuestionIds(nextState);
    if (missingQuestionIds.length > 0) {
      const reminder = CONTINUE_PATTERN.test(normalizedUserInput)
        ? 'Для перехода дальше нужны ответы на все вопросы planning.'
        : 'Пока не хватает ответов на все вопросы planning.';

      const body = [reminder, '', 'Статус вопросов:', formatQuestionsChecklist(nextState), '', 'Еще не отвечено:', buildMissingQuestionsText(nextState, missingQuestionIds)]
        .filter(Boolean)
        .join('\n');

      return {
        taskState: {
          ...nextState,
          stage: 'planning',
          currentStep: 'Собираем ответы на все вопросы planning.',
          expectedAction: 'Дайте ответы на оставшиеся вопросы (можно частями).',
          updatedAt: new Date().toISOString(),
          version: nextState.version + 1,
        },
        assistantText: formatTaskMessage('planning', 'Собираем ответы на все вопросы planning.', 'Дайте ответы на оставшиеся вопросы (можно частями).', body),
        usage: accumulatedUsage,
      };
    }

    nextState = transitionStage(
      input.chatId,
      nextState,
      'execution',
      'На основе всех ответов формируем рабочий промпт.',
      'Подождите, идет генерация промпта и валидация.',
      'planning_completed',
    );

    const executionResult = await executeAndValidate(input.chatId, nextState, input.llmCall, null);
    return {
      ...executionResult,
      usage: addUsage(accumulatedUsage, executionResult.usage),
    };
  }

  if (input.taskState.stage === 'execution') {
    console.info(`[task-fsm] chat=${input.chatId} event=execution_resume transition=execution->validation`);
    return executeAndValidate(input.chatId, input.taskState, input.llmCall, null);
  }

  if (input.taskState.stage === 'validation') {
    if (SATISFIED_PATTERN.test(normalizedUserInput)) {
      const doneState = transitionStage(
        input.chatId,
        input.taskState,
        'done',
        'Задача завершена. Финальный промпт зафиксирован.',
        'Создайте новый чат, если нужно запустить новую задачу.',
        'validation_approved',
      );
      const finalPrompt = doneState.lastGeneratedPrompt ?? 'Финальный промпт отсутствует.';
      return {
        taskState: doneState,
        assistantText: formatTaskMessage('done', doneState.currentStep, doneState.expectedAction, `Финальный промпт:\n${finalPrompt}`),
        usage: createEmptyUsage(),
      };
    }

    const executionState = transitionStage(
      input.chatId,
      input.taskState,
      'execution',
      'Пересобираем промпт с учетом обратной связи пользователя.',
      'Подождите, идет пересборка промпта и повторная валидация.',
      'validation_feedback_received',
    );
    return executeAndValidate(input.chatId, executionState, input.llmCall, normalizedUserInput || null);
  }

  return {
    taskState: input.taskState,
    assistantText: formatTaskMessage(
      'done',
      'Сценарий завершен.',
      'Создайте новый чат и выберите задачу для нового прохода.',
      `Сценарий задачи уже завершен.\n\nФинальный промпт:\n${input.taskState.lastGeneratedPrompt ?? 'Финальный промпт отсутствует.'}`,
    ),
    usage: createEmptyUsage(),
  };
}
