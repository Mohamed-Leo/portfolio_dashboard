export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch('/api/v1' + path, {
      ...options,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(10_000)])
        : AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'message' in body &&
      typeof body.message === 'string' && body.message.length <= 300
      ? body.message
      : 'The request failed. Please try again.';
    throw new ApiError(response.status, message);
  }

  return body;
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
