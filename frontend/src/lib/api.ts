import axios, { type InternalAxiosRequestConfig } from "axios";

/*
 * How the frontend talks to the backend
 * -------------------------------------
 * 1. Every request goes through `http` (one axios client).
 * 2. Before a request is sent, we add the access token to the Authorization header.
 * 3. If a request comes back 401 (access token expired), we get a new access token
 *    from /auth/refresh and send the original request again, once.
 */

/* ---------- Access token: kept in memory only ---------- */

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

/* ---------- The axios client ---------- */

export const http = axios.create({
  baseURL: "/api/v1", // Vite forwards /api to the backend in dev; Nginx will in production
  withCredentials: true, // send the httpOnly refresh cookie
});

// Step 2: attach the access token to every request.
http.interceptors.request.use((config) => {
  const token = session.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Step 3: on 401, refresh once and retry the request.
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as InternalAxiosRequestConfig & { retried?: boolean };
    const status = error.response?.status;
    const isAuthRoute = request?.url?.startsWith("/auth/");

    // For /auth/* a 401 means "wrong password" or "no session", not "token expired".
    if (status === 401 && request && !request.retried && !isAuthRoute) {
      request.retried = true;
      await refreshSession(); // throws if the session is really over
      return http(request); // the request interceptor adds the new token
    }

    throw toApiError(error);
  },
);

/* ---------- Refreshing the access token ---------- */

// If several requests fail at the same time, they all wait for this one refresh
// instead of each starting their own.
let refreshInProgress: Promise<string> | null = null;

export function refreshSession(): Promise<string> {
  if (!refreshInProgress) {
    refreshInProgress = doRefresh().finally(() => {
      refreshInProgress = null;
    });
  }
  return refreshInProgress;
}

async function doRefresh(): Promise<string> {
  try {
    // The Web Lock makes browser tabs take turns, so two tabs never send the same
    // refresh cookie at once (the backend would treat the second one as stolen).
    const token = await runInAllTabsLock(async () => {
      const response = await http.post<{ accessToken: string }>("/auth/refresh");
      return response.data.accessToken;
    });
    session.set(token);
    return token;
  } catch (error) {
    session.clear();
    throw toApiError(error);
  }
}

function runInAllTabsLock<T>(task: () => Promise<T>): Promise<T> {
  if ("locks" in navigator) {
    return navigator.locks.request("knowledge-ops-refresh", task);
  }
  return task(); // very old browsers: no cross-tab lock
}

/* ---------- Errors ---------- */

export type FieldError = { path: string; message: string };

// Same shape as the backend's errorHandler: { error: { code, message, details } }
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

type ErrorBody = { error?: { code?: string; message?: string; details?: FieldError[] } };

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError<ErrorBody>(error)) {
    // The server answered with an error status
    if (error.response) {
      const body = error.response.data?.error;
      return new ApiError(
        error.response.status,
        body?.code ?? "UNKNOWN",
        body?.message ?? "Something went wrong",
        body?.details,
      );
    }
    // No answer at all: server down or no internet
    return new ApiError(0, "NETWORK", "Can't reach the server. Check your connection.");
  }

  return new ApiError(0, "UNKNOWN", "Something went wrong");
}

// Message for one form field, e.g. fieldError(error, "email")
export function fieldError(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  return error.details?.find((detail) => detail.path === field)?.message;
}
