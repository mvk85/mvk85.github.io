import { HttpError } from '@/shared/api/client';

export function normalizeError(error: unknown): string {
  if (error instanceof HttpError) {
    return `Ошибка API (${error.status}): ${error.message}`;
  }

  if (error instanceof SyntaxError) {
    return 'Сервер вернул невалидный JSON.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Неизвестная ошибка при выполнении запроса.';
}
