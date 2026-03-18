export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

async function requestJson<TResponse>(
  url: string,
  init: RequestInit,
  headers: Record<string, string>,
): Promise<TResponse> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const payloadObject = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : null;
    const message = payloadObject?.message;
    const error = payloadObject?.error;
    const errorText =
      (Array.isArray(message) ? message.join('; ') : null) ||
      (typeof message === 'string' ? message : null) ||
      (typeof error === 'string' ? error : null) ||
      response.statusText ||
      'Request failed';
    throw new HttpError(response.status, String(errorText));
  }

  return payload as TResponse;
}

export async function postJson<TResponse>(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  options?: { signal?: AbortSignal },
): Promise<TResponse> {
  return requestJson<TResponse>(
    url,
    {
      method: 'POST',
      body: JSON.stringify(body),
      signal: options?.signal,
    },
    headers,
  );
}

export async function getJson<TResponse>(url: string, headers: Record<string, string>, options?: { signal?: AbortSignal }): Promise<TResponse> {
  return requestJson<TResponse>(
    url,
    {
      method: 'GET',
      signal: options?.signal,
    },
    headers,
  );
}
