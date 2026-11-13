import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button, Field, FormError } from "../components/ui";
import { useLogin } from "../features/auth/hooks";
import { ApiError, fieldError } from "../lib/api";
import { SignInAside } from "../features/auth/AuthAside";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/workspaces";

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    login.mutate(
      { email: String(form.get("email")), password: String(form.get("password")) },
      { onSuccess: () => navigate(from, { replace: true }) },
    );
  };

  const hasFieldErrors = login.error instanceof ApiError && login.error.details?.length;

  return (
    <AuthLayout
      title="Welcome back"
      intro="Sign in to ask your workspaces and see where each answer came from."
      aside={<SignInAside />}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormError message={!hasFieldErrors ? login.error?.message : undefined} />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={fieldError(login.error, "email")}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={fieldError(login.error, "password")}
        />
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link to="/register" className="font-semibold text-pine underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
