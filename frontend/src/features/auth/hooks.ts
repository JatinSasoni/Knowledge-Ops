import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { ApiError, refreshSession, session } from "../../lib/api";
import type { AuthResponse, User } from "../../types";
import * as authApi from "./api";

export const meKey = ["me"];

// Who is signed in? Returns the user, or null when signed out.
export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: loadCurrentUser,
    staleTime: Infinity,
  });
}

async function loadCurrentUser(): Promise<User | null> {
  // After a page reload the access token (kept in memory) is gone.
  // Try to get a new one from the refresh cookie before asking who we are.
  if (!session.get()) {
    try {
      await refreshSession();
    } catch (error) {
      const noSession = error instanceof ApiError && error.status === 401;
      if (noSession) return null; // simply signed out
      throw error; // server down etc.: show an error, don't pretend we're signed out
    }
  }
  return authApi.getMe();
}

// After login or register: keep the token and remember the user.
function useStartSession() {
  const queryClient = useQueryClient();
  return (result: AuthResponse) => {
    session.set(result.accessToken);
    queryClient.setQueryData(meKey, result.user);
  };
}

export function useLogin() {
  const startSession = useStartSession();
  return useMutation({ mutationFn: authApi.login, onSuccess: startSession });
}

export function useRegister() {
  const startSession = useStartSession();
  return useMutation({ mutationFn: authApi.register, onSuccess: startSession });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    try {
      await authApi.logout(); // the backend revokes the refresh token and clears the cookie
    } catch {
      // Already signed out or offline: still sign out locally.
    }
    session.clear();
    queryClient.clear(); // forget all cached data so the next user can't see it
    navigate("/login", { replace: true });
  };
}
