import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { Button, Field, FormError } from "../components/ui";
import { SignInAside } from "../features/auth/AuthAside";
import { useResetPassword } from "../features/auth/hooks";
import { ApiError, fieldError } from "../lib/api";
import { AuthLayout } from "./AuthLayout";

const linkClass = "font-semibold text-pine underline underline-offset-4";

/*
 * Opened from the email link: /reset-password?token=…
 * The token is read once into state, then removed from the address bar, so it doesn't
 * stay in the browser history or get copied along with the URL.
 */
export function ResetPasswordPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [token] = useState(() => searchParams.get("token") ?? "");
  const reset = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    if (searchParams.has("token")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    reset.mutate({ token, password });
  };

  // 400 = the link is used, expired or wrong (any other error is shown as is).
  const linkInvalid =
    reset.error instanceof ApiError &&
    reset.error.status === 400 &&
    !fieldError(reset.error, "password");

  return (
    <AuthLayout
      title="Choose a new password"
      intro="Pick something you haven't used before. You'll be signed out on every device."
      aside={<SignInAside />}
      asideSide="left"
      redirectIfSignedIn={false}
    >
      {!token ? (
        <Notice title="This link is incomplete">
          Open the button in your reset email again, or{" "}
          <Link to="/forgot-password" className={linkClass}>
            request a new link
          </Link>
          .
        </Notice>
      ) : reset.isSuccess ? (
        <Notice title="Password changed">
          You've been signed out everywhere. Sign in with your new password to continue.
          <span className="mt-4 block">
            <Link
              to="/login"
              className="inline-flex rounded-md bg-pine px-4 py-2.5 text-sm font-semibold text-paper hover:bg-pine-dark"
            >
              Sign in
            </Link>
          </span>
        </Notice>
      ) : linkInvalid ? (
        <Notice title="This link doesn't work anymore">
          Reset links work once and expire after 30 minutes.{" "}
          <Link to="/forgot-password" className={linkClass}>
            Request a new link
          </Link>
          .
        </Notice>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <FormError
            message={
              reset.isError && !fieldError(reset.error, "password")
                ? reset.error.message
                : undefined
            }
          />
          <Field
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            hint="At least 8 characters."
            error={fieldError(reset.error, "password")}
          />
          <Field
            label="Repeat the new password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            error={mismatch ? "The two passwords don't match." : undefined}
          />
          <Button type="submit" disabled={reset.isPending || password.length < 8 || !confirm}>
            {reset.isPending ? "Saving…" : "Save new password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5">
      <p className="font-display text-[20px] font-bold">{title}</p>
      <p className="text-[15px] leading-relaxed text-ink/80">{children}</p>
    </div>
  );
}
