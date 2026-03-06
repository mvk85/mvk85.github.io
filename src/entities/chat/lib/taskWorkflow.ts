import { assertTaskTransition } from '@/entities/chat/lib/taskStateMachine';
import { getTaskInvariants } from '@/entities/chat/lib/taskConfig';
import type { FrontendPromptTaskState, LlmMessage, TaskInvariant, TaskInvariantViolation, TaskPlanningQuestion, TaskValidationResult } from '@/entities/chat/model/types';
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
const FRAMEWORK_INVARIANT_PATTERN = /\b(react|vue|svelte)\b/i;
const DISALLOWED_FRAMEWORK_PATTERN = /\b(angular|next(?:\.js)?|nuxt|ember|solid|preact|backbone)\b/i;
const DESIGN_SYSTEM_INVARIANT_PATTERN = /\b(mui|material ui|ant|ant design|tailwind)\b/i;
const DISALLOWED_API_PATTERN = /\b(graphql|grpc|soap|apollo|rpc)\b/i;

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
  return [
    `**Этап задачи:** ${stage}  `,
    `**Текущий шаг:** ${currentStep}  `,
    `**Ожидаемое действие:** ${expectedAction}`,
    '',
    body,
  ].join('\n');
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
    invariantViolation: null,
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
    invariantViolation: null,
    updatedAt: nowIso,
    version: state.version + 1,
  };
}

function setInvariantViolation(
  state: FrontendPromptTaskState,
  violation: TaskInvariantViolation | null,
  currentStep: string,
  expectedAction: string,
  nowIso: string = new Date().toISOString(),
): FrontendPromptTaskState {
  return {
    ...state,
    invariantViolation: violation,
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

function formatInvariantViolationBody(violation: TaskInvariantViolation): string {
  return [
    '**Нарушение инварианта:**',
    `- Инвариант: ${violation.ruleText}.`,
    `- Вопрос: ${violation.questionId.replace('q', '')}. ${violation.questionText}.`,
    '- Что не так: ответ противоречит ограничению задачи.',
    '- Что сделать: исправьте ответ по инварианту.',
  ].join('\n');
}

function detectInvariantViolationLocally(invariant: TaskInvariant, text: string): boolean {
  const normalized = text.trim();
  if (!normalized) {
    return true;
  }

  if (invariant.questionId === 'q2') {
    return !FRAMEWORK_INVARIANT_PATTERN.test(normalized) || DISALLOWED_FRAMEWORK_PATTERN.test(normalized);
  }

  if (invariant.questionId === 'q3') {
    return !DESIGN_SYSTEM_INVARIANT_PATTERN.test(normalized) || /\bcustom\b/i.test(normalized);
  }

  if (invariant.questionId === 'q4') {
    return !/\brest\b/i.test(normalized) || DISALLOWED_API_PATTERN.test(normalized);
  }

  return false;
}

async function validateInvariantAnswer(
  invariant: TaskInvariant,
  answer: string,
  llmCall: TaskLlmCall,
): Promise<{ violation: TaskInvariantViolation | null; usage: ChatCompletionUsage }> {
  const fallbackViolation = detectInvariantViolationLocally(invariant, answer)
    ? {
        invariantId: invariant.id,
        questionId: invariant.questionId,
        questionText: invariant.questionText,
        ruleText: invariant.ruleText,
      }
    : null;

  try {
    const { text, usage } = await llmCall([
      {
        role: 'system',
        content: `Ты проверяешь ответ пользователя на соответствие инварианту задачи.
Верни только JSON:
{
  "status": "passed" | "failed"
}
Если есть хоть малейшее нарушение инварианта, верни status=failed.
Не добавляй markdown и комментарии.`,
      },
      {
        role: 'user',
        content: `Вопрос: ${invariant.questionText}
Инвариант: ${invariant.ruleText}
Ответ пользователя: ${answer}`,
      },
    ]);
    const parsed = extractJson(text) as { status?: unknown };
    return {
      violation:
        parsed.status === 'failed'
          ? {
              invariantId: invariant.id,
              questionId: invariant.questionId,
              questionText: invariant.questionText,
              ruleText: invariant.ruleText,
            }
          : parsed.status === 'passed'
            ? null
            : fallbackViolation,
      usage,
    };
  } catch {
    return {
      violation: fallbackViolation,
      usage: createEmptyUsage(),
    };
  }
}

async function validateChangedPlanningAnswers(
  state: FrontendPromptTaskState,
  incomingAnswers: Record<string, string>,
  llmCall: TaskLlmCall,
): Promise<{
  acceptedAnswers: Record<string, string>;
  violation: TaskInvariantViolation | null;
  usage: ChatCompletionUsage;
}> {
  if (!state.invariantsEnabled) {
    return {
      acceptedAnswers: incomingAnswers,
      violation: null,
      usage: createEmptyUsage(),
    };
  }

  const invariantsByQuestion = new Map(getTaskInvariants(state.taskId).map((invariant) => [invariant.questionId, invariant]));
  const acceptedAnswers: Record<string, string> = {};
  let accumulatedUsage = createEmptyUsage();

  for (const [questionId, answer] of Object.entries(incomingAnswers)) {
    const invariant = invariantsByQuestion.get(questionId);
    if (!invariant) {
      acceptedAnswers[questionId] = answer;
      continue;
    }

    const validation = await validateInvariantAnswer(invariant, answer, llmCall);
    accumulatedUsage = addUsage(accumulatedUsage, validation.usage);
    if (validation.violation) {
      return {
        acceptedAnswers,
        violation: validation.violation,
        usage: accumulatedUsage,
      };
    }

    acceptedAnswers[questionId] = answer;
  }

  return {
    acceptedAnswers,
    violation: null,
    usage: accumulatedUsage,
  };
}

async function validateGeneratedPromptInvariants(
  state: FrontendPromptTaskState,
  generatedPrompt: string,
  llmCall: TaskLlmCall,
): Promise<{ violation: TaskInvariantViolation | null; usage: ChatCompletionUsage }> {
  if (!state.invariantsEnabled) {
    return {
      violation: null,
      usage: createEmptyUsage(),
    };
  }

  const invariants = getTaskInvariants(state.taskId);
  const fallbackViolation = invariants.find((invariant) => detectInvariantViolationLocally(invariant, generatedPrompt));

  try {
    const { text, usage } = await llmCall([
      {
        role: 'system',
        content: `Ты проверяешь итоговый промпт задачи на жесткое соответствие инвариантам.
Верни только JSON:
{
  "status": "passed" | "failed",
  "violatedInvariantId": "id или null"
}
Если промпт нарушает хотя бы один инвариант, верни status=failed и укажи violatedInvariantId.
Не добавляй markdown и комментарии.`,
      },
      {
        role: 'user',
        content: `Инварианты:
${invariants.map((invariant) => `- ${invariant.id}: ${invariant.ruleText}`).join('\n')}

Итоговый промпт:
${generatedPrompt}`,
      },
    ]);
    const parsed = extractJson(text) as { status?: unknown; violatedInvariantId?: unknown };
    const violatedInvariant =
      parsed.status === 'failed' && typeof parsed.violatedInvariantId === 'string'
        ? invariants.find((invariant) => invariant.id === parsed.violatedInvariantId) ?? fallbackViolation
        : parsed.status === 'failed'
          ? fallbackViolation
          : null;

    return {
      violation: violatedInvariant
        ? {
            invariantId: violatedInvariant.id,
            questionId: violatedInvariant.questionId,
            questionText: violatedInvariant.questionText,
            ruleText: violatedInvariant.ruleText,
          }
        : null,
      usage,
    };
  } catch {
    return {
      violation: fallbackViolation
        ? {
            invariantId: fallbackViolation.id,
            questionId: fallbackViolation.questionId,
            questionText: fallbackViolation.questionText,
            ruleText: fallbackViolation.ruleText,
          }
        : null,
      usage: createEmptyUsage(),
    };
  }
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
  const invariantCheck = await validateGeneratedPromptInvariants(state, generatedPrompt, llmCall);
  if (invariantCheck.violation) {
    const blockedState = transitionStage(
      chatId,
      state,
      'validation',
      'Исправление ответа, который нарушает инвариант задачи.',
      'Исправьте ответ на проблемный вопрос в соответствии с инвариантом.',
      'execution_invariant_failed',
    );
    const violatedState = setInvariantViolation(
      {
        ...blockedState,
        lastGeneratedPrompt: generatedPrompt,
      },
      invariantCheck.violation,
      'Исправление ответа, который нарушает инвариант задачи.',
      'Исправьте ответ на проблемный вопрос в соответствии с инвариантом.',
    );

    return {
      taskState: violatedState,
      assistantText: formatTaskMessage(
        violatedState.stage,
        violatedState.currentStep,
        violatedState.expectedAction,
        formatInvariantViolationBody(invariantCheck.violation),
      ),
      usage: addUsage(generation.usage, invariantCheck.usage),
    };
  }

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
    invariantViolation: null,
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
    usage: addUsage(addUsage(generation.usage, invariantCheck.usage), review.usage),
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

    accumulatedUsage = addUsage(accumulatedUsage, extracted.usage);
    const invariantValidation = await validateChangedPlanningAnswers(nextState, mergedIncomingAnswers, input.llmCall);
    accumulatedUsage = addUsage(accumulatedUsage, invariantValidation.usage);
    nextState = mergePlanningAnswers(nextState, invariantValidation.acceptedAnswers);

    if (invariantValidation.violation) {
      const violatedState = setInvariantViolation(
        nextState,
        invariantValidation.violation,
        'Проверяем ответы пользователя на инварианты задачи.',
        'Исправьте ответ на проблемный вопрос в соответствии с инвариантом.',
      );

      return {
        taskState: violatedState,
        assistantText: formatTaskMessage(
          'planning',
          violatedState.currentStep,
          violatedState.expectedAction,
          formatInvariantViolationBody(invariantValidation.violation),
        ),
        usage: accumulatedUsage,
      };
    }

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
          invariantViolation: null,
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
    if (SATISFIED_PATTERN.test(normalizedUserInput) && !input.taskState.invariantViolation) {
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

    if (input.taskState.invariantViolation) {
      const extracted = await extractPlanningAnswers(input.taskState, normalizedUserInput, input.llmCall);
      const fromNumberedList = extractAnswersByNumbering(input.taskState, normalizedUserInput);
      const mergedIncomingAnswers: Record<string, string> = {
        ...extracted.answers,
        ...fromNumberedList,
      };
      const targetQuestionId = input.taskState.invariantViolation.questionId;

      if (!mergedIncomingAnswers[targetQuestionId]) {
        return {
          taskState: input.taskState,
          assistantText: formatTaskMessage(
            'validation',
            input.taskState.currentStep,
            input.taskState.expectedAction,
            formatInvariantViolationBody(input.taskState.invariantViolation),
          ),
          usage: extracted.usage,
        };
      }

      const validatedAnswers = await validateChangedPlanningAnswers(input.taskState, mergedIncomingAnswers, input.llmCall);
      const accumulatedUsage = addUsage(extracted.usage, validatedAnswers.usage);
      const nextState = mergePlanningAnswers(input.taskState, validatedAnswers.acceptedAnswers);

      if (validatedAnswers.violation) {
        const violatedState = setInvariantViolation(
          nextState,
          validatedAnswers.violation,
          'Исправление ответа, который нарушает инвариант задачи.',
          'Исправьте ответ на проблемный вопрос в соответствии с инвариантом.',
        );
        return {
          taskState: violatedState,
          assistantText: formatTaskMessage(
            'validation',
            violatedState.currentStep,
            violatedState.expectedAction,
            formatInvariantViolationBody(validatedAnswers.violation),
          ),
          usage: accumulatedUsage,
        };
      }

      const executionState = transitionStage(
        input.chatId,
        nextState,
        'execution',
        'Пересобираем промпт с учетом исправленного ответа пользователя.',
        'Подождите, идет пересборка промпта и повторная валидация.',
        'validation_invariant_fixed',
      );
      const executionResult = await executeAndValidate(input.chatId, executionState, input.llmCall, null);
      return {
        ...executionResult,
        usage: addUsage(accumulatedUsage, executionResult.usage),
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
