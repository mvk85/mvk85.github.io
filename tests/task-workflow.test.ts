import { describe, expect, it } from 'vitest';

import { createFrontendPromptInitialTaskState } from '../src/entities/chat/lib/taskConfig';
import { runFrontendPromptTaskTurn } from '../src/entities/chat/lib/taskWorkflow';
import type { ChatCompletionUsage } from '../src/entities/chat-response/model/types';
import type { LlmMessage } from '../src/entities/chat/model/types';

type StubResponse = {
  text: string;
  usage?: ChatCompletionUsage;
};

function createUsage(): ChatCompletionUsage {
  return {
    prompt_tokens: 10,
    completion_tokens: 5,
    total_tokens: 15,
  };
}

function createLlmStub(responses: StubResponse[]) {
  let index = 0;
  return async (_messages: LlmMessage[]) => {
    const response = responses[index];
    index += 1;
    if (!response) {
      return {
        text: '{}',
        usage: createUsage(),
      };
    }

    return {
      text: response.text,
      usage: response.usage ?? createUsage(),
    };
  };
}

describe('task workflow', () => {
  it('остается в planning, пока не заполнены все ответы', async () => {
    const state = createFrontendPromptInitialTaskState('2026-03-01T00:00:00.000Z');
    const llm = createLlmStub([{ text: '{"answers":{"q1":"SaaS платформа"}}' }]);

    const result = await runFrontendPromptTaskTurn({
      chatId: 'chat-1',
      taskState: state,
      userInput: '1. SaaS платформа',
      llmCall: llm,
    });

    expect(result.taskState.stage).toBe('planning');
    expect(result.taskState.planningAnswers.q1).toBe('SaaS платформа');
    expect(result.assistantText).toContain('Этап задачи: planning');
    expect(result.assistantText).toContain('Еще не отвечено');
  });

  it('после всех ответов проходит execution->validation', async () => {
    const state = createFrontendPromptInitialTaskState('2026-03-01T00:00:00.000Z');
    const llm = createLlmStub([
      { text: '{"answers":{}}' },
      { text: 'Итоговый промпт для code assistant' },
      { text: '{"status":"approved","reviewSummary":"Ок","issues":[],"clarificationQuestions":[]}' },
    ]);

    const result = await runFrontendPromptTaskTurn({
      chatId: 'chat-2',
      taskState: state,
      userInput:
        '1. SaaS\n2. React + TS\n3. MUI\n4. REST + auth\n5. A11y + perf\n6. unit+e2e\n7. GitHub Actions\n8. DoD: рабочее приложение',
      llmCall: llm,
    });

    expect(result.taskState.stage).toBe('validation');
    expect(result.taskState.lastGeneratedPrompt).toContain('Итоговый промпт');
    expect(result.assistantText).toContain('Этап задачи: validation');
  });

  it('в validation переходит к done по подтверждению пользователя', async () => {
    const state = createFrontendPromptInitialTaskState('2026-03-01T00:00:00.000Z');
    const validationState = {
      ...state,
      stage: 'validation' as const,
      currentStep: 'Валидация',
      expectedAction: 'Подтвердите',
      lastGeneratedPrompt: 'Финальный промпт',
      validationResult: {
        status: 'approved' as const,
        reviewSummary: 'Замечаний нет',
        issues: [],
        clarificationQuestions: [],
        reviewedAt: '2026-03-01T01:00:00.000Z',
      },
    };

    const result = await runFrontendPromptTaskTurn({
      chatId: 'chat-3',
      taskState: validationState,
      userInput: 'Да, устраивает',
      llmCall: createLlmStub([]),
    });

    expect(result.taskState.stage).toBe('done');
    expect(result.assistantText).toContain('Этап задачи: done');
    expect(result.assistantText).toContain('Финальный промпт');
  });
});
