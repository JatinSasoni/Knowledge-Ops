const TOKEN_KEY = "token";

// The JWT lives in localStorage (plan's v1 choice). Any script on the page can read it,
// so XSS = token theft. v1.1 moves this to an httpOnly cookie.
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export type FieldError = { path: string; message: string };

// Mirrors the backend errorHandler's { error: { code, message, details } } shape.
export class ApiError extends Error {
  status: number;
  code: string;
  details?: FieldError[];

  constructor(status: number, code: string, message: string, details?: FieldError[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ErrorBody = { error?: { code?: string; message?: string; details?: unknown } };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");

  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Relative URL: Vite proxies /api in dev, Nginx will in production.
  const res = await fetch(`/api/v1${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);

  // fetch only rejects on network failure; HTTP errors must be thrown by hand.
  if (!res.ok) {
    const err = (data as ErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "UNKNOWN",
      err?.message ?? res.statusText,
      Array.isArray(err?.details) ? (err.details as FieldError[]) : undefined,
    );
  }

  return data as T;
}

export const fieldError = (error: unknown, path: string) =>
  error instanceof ApiError ? error.details?.find((d) => d.path === path)?.message : undefined;
