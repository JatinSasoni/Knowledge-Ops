import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api, tokenStore } from "../../lib/api";
import type { AuthResponse, User } from "../../types";

export const meKey = ["me"] as const;

type Credentials = { email: string; password: string };

const login = (input: Credentials) =>
  api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });

// The current user is server state: it lives in the query cache, not in a React context.
export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async () => (tokenStore.get() ? (await api<{ user: User }>("/auth/me")).user : null),
    staleTime: Infinity,
  });
}

function useStartSession() {
  const qc = useQueryClient();
  return ({ user, token }: AuthResponse) => {
    tokenStore.set(token);
    qc.setQueryData(meKey, user);
  };
}

export function useLogin() {
  const startSession = useStartSession();
  return useMutation({ mutationFn: login, onSuccess: startSession });
}

// The backend's register returns no token, so sign in right after creating the account.
export function useRegister() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: async (input: Credentials) => {
      await api<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return login(input);
    },
    onSuccess: startSession,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return () => {
    tokenStore.clear();
    qc.clear(); // drop every cached response so the next user never sees this user's data
    navigate("/login", { replace: true });
  };
}
