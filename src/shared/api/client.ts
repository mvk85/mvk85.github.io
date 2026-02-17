export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function postJson<TResponse>(
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorText = payload?.error?.message || payload?.error || response.statusText || 'Request failed';
    throw new HttpError(response.status, String(errorText));
  }

  return payload as TResponse;
}
