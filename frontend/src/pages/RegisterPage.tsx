import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button, Field, FormError } from "../components/ui";
import { useRegister } from "../features/auth/hooks";
import { ApiError, fieldError } from "../lib/api";
import { AuthLayout } from "./AuthLayout";

export function RegisterPage() {
  const register = useRegister();
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    register.mutate(
      { email: String(form.get("email")), password: String(form.get("password")) },
      { onSuccess: () => navigate("/workspaces", { replace: true }) },
    );
  };

  const error = register.error;
  const hasFieldErrors = error instanceof ApiError && error.details?.length;
  const message =
    error instanceof ApiError && error.status === 409
      ? "An account with this email already exists. Sign in instead."
      : error?.message;

  return (
    <AuthLayout title="Create your account">
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormError message={!hasFieldErrors ? message : undefined} />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={fieldError(error, "email")}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          error={fieldError(error, "password")}
        />
        <Button type="submit" disabled={register.isPending}>
          {register.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-pine underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
