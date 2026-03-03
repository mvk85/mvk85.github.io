import { LONG_TERM_MEMORY_LIMIT } from '@/entities/chat/lib/constants';
import { normalizeLongTermMemoryItems } from '@/entities/chat/lib/longTermMemoryStorage';
import { normalizeWorkingMemory } from '@/entities/chat/lib/workingMemoryStorage';
import type { ChatMessage, LongTermMemoryItem, LlmMessage, WorkingMemory } from '@/entities/chat/model/types';

const WORKING_MEMORY_EXTRACTION_SYSTEM_PROMPT = `Ты обновляешь рабочую память задачи по диалогу.
Верни строго JSON-объект без markdown и пояснений.
Цель: фиксировать цель, задачи, фокус, ограничения.
Если данных для поля нет — используй null/[].
Поле tasks: массив задач с title,status,notes (id не нужен).
status только: todo,in_progress,done,blocked.
updated_at всегда ISO-время текущего обновления.`;

const LONG_TERM_MEMORY_EXTRACTION_SYSTEM_PROMPT = `Ты обновляешь долговременную память пользователя.
Верни строго JSON-объект формата {"items":[...]} без markdown и пояснений.
Каждый item: kind,text,confidence,updated_at.
kind только: profile,preference,knowledge,decision.
confidence от 0 до 1.
На конфликт фактов оставляй только последнюю актуальную версию.
Держи максимум ${LONG_TERM_MEMORY_LIMIT} пунктов.`;

function cleanJsonFromCodeFence(rawText: string): string {
  const trimmed = rawText.trim();
  if (!(trimmed.startsWith('```') && trimmed.endsWith('```'))) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
}

function parseJson(rawText: string): unknown {
  return JSON.parse(cleanJsonFromCodeFence(rawText));
}

function toCompactTranscript(messages: ChatMessage[], maxMessages: number): string {
  const recent = messages.slice(-maxMessages);
  return recent.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n');
}

export function buildWorkingMemoryExtractionMessages(messages: ChatMessage[], currentMemory: WorkingMemory | null): LlmMessage[] {
  return [
    {
      role: 'system',
      content: WORKING_MEMORY_EXTRACTION_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `Текущая рабочая память:\n${JSON.stringify(currentMemory, null, 2)}\n\nПоследний контекст диалога:\n${toCompactTranscript(messages, 12)}`,
    },
  ];
}

export function parseWorkingMemory(rawText: string): WorkingMemory {
  const parsed = parseJson(rawText);
  const normalized = normalizeWorkingMemory(parsed);

  if (!normalized) {
    throw new Error('Working memory extractor вернул невалидный JSON.');
  }

  return normalized;
}

export function buildLongTermMemoryExtractionMessages(messages: ChatMessage[], currentMemory: LongTermMemoryItem[]): LlmMessage[] {
  return [
    {
      role: 'system',
      content: LONG_TERM_MEMORY_EXTRACTION_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `Текущая долговременная память:\n${JSON.stringify({ items: currentMemory }, null, 2)}\n\nНовый контекст для обновления:\n${toCompactTranscript(messages, 16)}`,
    },
  ];
}

export function parseLongTermMemory(rawText: string): LongTermMemoryItem[] {
  const parsed = parseJson(rawText) as { items?: unknown } | unknown;
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Long-term memory extractor вернул невалидный JSON.');
  }

  const items = normalizeLongTermMemoryItems((parsed as { items?: unknown }).items);
  return items.slice(-LONG_TERM_MEMORY_LIMIT);
}

export function buildWorkingMemorySystemMessage(memory: WorkingMemory): LlmMessage {
  return {
    role: 'system',
    content: `Рабочая память текущего чата (актуальная задача):\n${JSON.stringify(memory, null, 2)}`,
  };
}

export function buildLongTermMemorySystemMessage(memory: LongTermMemoryItem[]): LlmMessage {
  return {
    role: 'system',
    content: `Долговременная память пользователя (применять ко всем чатам):\n${JSON.stringify({ items: memory }, null, 2)}`,
  };
}

export function prependMemoryToContext(
  contextMessages: LlmMessage[],
  workingMemory: WorkingMemory | null,
  longTermMemory: LongTermMemoryItem[],
): LlmMessage[] {
  const memoryMessages: LlmMessage[] = [];
  if (workingMemory) {
    memoryMessages.push(buildWorkingMemorySystemMessage(workingMemory));
  }
  if (longTermMemory.length > 0) {
    memoryMessages.push(buildLongTermMemorySystemMessage(longTermMemory));
  }

  if (memoryMessages.length === 0) {
    return contextMessages;
  }

  return [...memoryMessages, ...contextMessages];
}
