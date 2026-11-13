/* ---------- Session ----------
   The access token lives only in memory (this variable). A reload wipes it, and the
   httpOnly refresh cookie, which JavaScript can never read, gets a new one from
   POST /auth/refresh. */

let accessToken: string | null = null;

export const session = {
  get: () => accessToken,
  set: (token: string) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};

// Tokens from before the cookie-based flow were kept in localStorage. Remove any leftover.
try {
  localStorage.removeItem("token");
} catch {
  /* storage blocked: nothing to remove */
}

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

async function toApiError(res: Response): Promise<ApiError> {
  const data: unknown = await res.json().catch(() => null);
  const err = (data as ErrorBody | null)?.error;
  return new ApiError(
    res.status,
    err?.code ?? "UNKNOWN",
    err?.message ?? res.statusText,
    Array.isArray(err?.details) ? (err.details as FieldError[]) : undefined,
  );
}

/* ---------- Refresh: one request at a time ----------
   The backend rotates the refresh token on every call and treats a reused token as theft,
   revoking the whole session. If five requests hit a 401 at once and each refreshed on its
   own, four would replay a token that was just rotated and log the user out. So every
   caller shares the same in-flight promise. */

let refreshing: Promise<string> | null = null;

export function refreshSession(): Promise<string> {
  refreshing ??= (async () => {
    try {
      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) throw await toApiError(res);
      const { accessToken: token } = (await res.json()) as { accessToken: string };
      session.set(token);
      return token;
    } catch (error) {
      session.clear();
      throw error;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// Endpoints whose 401 means "wrong credentials" or "no session", never "token expired".
const NO_RETRY = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

export async function api<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const token = session.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Relative URL: Vite proxies /api in dev, Nginx will in production. Same origin, so the
  // refresh cookie (path /api/v1/auth) is sent by the browser automatically.
  const res = await fetch(`/api/v1${path}`, { ...init, headers, credentials: "same-origin" });

  // Access token expired (15 min): get a new one once, then repeat the original request.
  if (res.status === 401 && !retried && !NO_RETRY.includes(path)) {
    await refreshSession(); // throws ApiError(401) if the session is really over
    return api<T>(path, init, true);
  }

  if (res.status === 204) return undefined as T;
  // fetch only rejects on network failure; HTTP errors must be thrown by hand.
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

export const fieldError = (error: unknown, path: string) =>
  error instanceof ApiError ? error.details?.find((d) => d.path === path)?.message : undefined;
