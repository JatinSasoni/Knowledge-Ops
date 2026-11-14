import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export function Field({ label, name, error, hint, ...input }: FieldProps) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="rounded-md border border-line bg-surface px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted/60 focus:border-pine aria-invalid:border-danger"
        {...input}
      />
      {error ? (
        <p id={`${name}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-pine text-paper hover:bg-pine-dark disabled:opacity-60"
      : "text-muted hover:text-ink hover:bg-line/50";
  return (
    <button
      className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
    >
      {message}
    </p>
  );
}

// Two-step destructive action: the first click arms it, the second confirms.
// It disarms itself after a few seconds so a stray click later does nothing.
export function ConfirmButton({
  label,
  confirmLabel = "Click again to confirm",
  onConfirm,
  disabled,
}: {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
        armed ? "bg-danger text-paper" : "text-muted hover:bg-danger/10 hover:text-danger"
      }`}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

export function RoleBadge({ role }: { role: "ADMIN" | "MEMBER" }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-semibold ${
        role === "ADMIN" ? "bg-pine text-paper" : "bg-sand text-ink"
      }`}
    >
      {role === "ADMIN" ? "Admin" : "Member"}
    </span>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg bg-surface ${className}`}>{children}</section>;
}
