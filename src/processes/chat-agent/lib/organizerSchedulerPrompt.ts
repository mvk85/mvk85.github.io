import type { LlmMessage } from '@/entities/chat/model/types';

export function buildOrganizerSchedulerSystemMessage(mcpEnabled: boolean): LlmMessage {
  return {
    role: 'system',
    content: `# Organizer Scheduler Mode

mcp_enabled = ${mcpEnabled ? 'true' : 'false'}

Применяй эти правила только к основному ответу ассистента.

Если запрос пользователя однозначно про планирование действия (напоминание/запланировать задачу/активность/вызвать планировщик), верни только JSON без markdown и пояснений:
{
  "type": "organizer",
  "method": "scheduler",
  "value": "plan_action",
  "setting": {}
}

Возвращай этот JSON при явном интенте запланировать действие. Примеры интента:
- "планировщик"
- "запланируй задачу"
- "запланируй активность"
- "вызови планировщик"
- любые аналогичные просьбы запланировать действие.

Если интент неоднозначный или не про планирование действия:
- не возвращай JSON organizer;
- отвечай обычным текстом.

Важно:
- не добавляй дополнительные поля;
- не добавляй текст до или после JSON.`,
  };
}

export function prependOrganizerSchedulerToContext(contextMessages: LlmMessage[], mcpEnabled: boolean): LlmMessage[] {
  if (!mcpEnabled) {
    return contextMessages;
  }
  return [buildOrganizerSchedulerSystemMessage(mcpEnabled), ...contextMessages];
}
