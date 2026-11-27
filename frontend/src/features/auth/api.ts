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

// The "credential" is the ID token Google's button gave us. The server verifies it with
// Google and answers exactly like a password login: { user, accessToken } + refresh cookie.
export async function googleLogin(credential: string): Promise<AuthResponse> {
  const response = await http.post<AuthResponse>("/auth/google", { credential });
  return response.data;
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}

// Always answers the same message, whether or not the email has an account.
export async function forgotPassword(email: string): Promise<string> {
  const response = await http.post<{ message: string }>("/auth/forgot-password", { email });
  return response.data.message;
}

export async function resetPassword(input: { token: string; password: string }): Promise<string> {
  const response = await http.post<{ message: string }>("/auth/reset-password", input);
  return response.data.message;
}

export async function getMe(): Promise<User> {
  const response = await http.get<{ user: User }>("/auth/me");
  return response.data.user;
}
