import { http } from "../../lib/api";
import type { AuthResponse, User } from "../../types";

export type Credentials = { email: string; password: string };

export async function login(credentials: Credentials): Promise<AuthResponse> {
  const response = await http.post<AuthResponse>("/auth/login", credentials);
  return response.data;
}

export async function register(credentials: Credentials): Promise<AuthResponse> {
  const response = await http.post<AuthResponse>("/auth/register", credentials);
  return response.data;
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}

export async function getMe(): Promise<User> {
  const response = await http.get<{ user: User }>("/auth/me");
  return response.data.user;
}
