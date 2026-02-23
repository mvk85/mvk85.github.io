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
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorText = payload?.error?.message || payload?.error || response.statusText || 'Request failed';
    throw new HttpError(response.status, String(errorText));
  }

  return payload as TResponse;
}

export async function postJson<TResponse>(
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<TResponse> {
  return requestJson<TResponse>(
    url,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    headers,
  );
}

export async function getJson<TResponse>(url: string, headers: Record<string, string>): Promise<TResponse> {
  return requestJson<TResponse>(
    url,
    {
      method: 'GET',
    },
    headers,
  );
}
