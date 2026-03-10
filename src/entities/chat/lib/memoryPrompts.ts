import { LONG_TERM_MEMORY_LIMIT } from '@/entities/chat/lib/constants';

export const WORKING_MEMORY_EXTRACTION_SYSTEM_PROMPT = `Ты обновляешь рабочую память задачи по диалогу.
Верни строго JSON-объект без markdown и пояснений.
Цель: фиксировать цель, задачи, фокус, ограничения.
Если данных для поля нет — используй null/[].
Поле tasks: массив задач с title,status,notes (id не нужен).
status только: todo,in_progress,done,blocked.
updated_at всегда ISO-время текущего обновления.`;

export const LONG_TERM_MEMORY_EXTRACTION_SYSTEM_PROMPT = `Ты обновляешь долговременную память пользователя.
Верни строго JSON-объект формата {"items":[...]} без markdown и пояснений.
Каждый item: kind,text,confidence,updated_at.
kind только: profile,preference,knowledge,decision.
confidence от 0 до 1.
На конфликт фактов оставляй только последнюю актуальную версию.
Держи максимум ${LONG_TERM_MEMORY_LIMIT} пунктов.`;
