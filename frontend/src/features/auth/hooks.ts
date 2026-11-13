import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api, ApiError, refreshSession, session } from "../../lib/api";
import type { AuthResponse, User } from "../../types";

export const meKey = ["me"] as const;

type Credentials = { email: string; password: string };

// The current user is server state: it lives in the query cache, not in a React context.
// After a page reload there's no access token in memory, so restore the session from the
// refresh cookie first. No cookie (or an expired one) simply means "signed out".
export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async (): Promise<User | null> => {
      if (!session.get()) {
        try {
          await refreshSession();
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) return null;
          throw error; // network or server error: let the query report it
        }
      }
      return (await api<{ user: User }>("/auth/me")).user;
    },
    staleTime: Infinity,
  });
}

function useStartSession() {
  const qc = useQueryClient();
  return ({ user, accessToken }: AuthResponse) => {
    session.set(accessToken);
    qc.setQueryData(meKey, user);
  };
}

export function useLogin() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (input: Credentials) =>
      api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: startSession,
  });
}

// Register signs the user in directly: the backend sets the refresh cookie and returns
// an access token, so there's no second login request.
export function useRegister() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (input: Credentials) =>
      api<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: startSession,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    try {
      // Revokes the refresh token server-side and clears the cookie.
      await api<void>("/auth/logout", { method: "POST" });
    } catch {
      /* already signed out or offline: still clear everything locally */
    }
    session.clear();
    qc.clear(); // drop every cached response so the next user never sees this user's data
    navigate("/login", { replace: true });
  };
}
