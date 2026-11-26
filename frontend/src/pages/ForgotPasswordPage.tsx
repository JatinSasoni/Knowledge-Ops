import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Button, Field, FormError } from "../components/ui";
import { SignInAside } from "../features/auth/AuthAside";
import { useForgotPassword } from "../features/auth/hooks";
import { fieldError } from "../lib/api";
import { AuthLayout } from "./AuthLayout";

export function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const [email, setEmail] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    forgot.mutate(email.trim());
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      intro="Enter the email you signed up with and we'll send you a link to choose a new one."
      aside={<SignInAside />}
      asideSide="left"
    >
      {forgot.isSuccess ? (
        // The server answers the same for every address, so this page does too:
        // it never confirms whether an account exists.
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <p className="font-display text-[20px] font-bold">Check your inbox</p>
          <p className="text-[15px] leading-relaxed text-ink/80">
            If <strong>{email.trim()}</strong> has a Citely account, a reset link is on its way. It
            works once and expires in 30 minutes.
          </p>
          <p className="text-sm text-muted">
            Nothing after a few minutes? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={() => forgot.reset()}
              className="font-semibold text-pine underline underline-offset-4"
            >
              try again
            </button>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <FormError
            message={
              forgot.isError && !fieldError(forgot.error, "email")
                ? forgot.error.message
                : undefined
            }
          />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            error={fieldError(forgot.error, "email")}
          />
          <Button type="submit" disabled={forgot.isPending || !email.trim()}>
            {forgot.isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="text-sm text-muted">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-pine underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
