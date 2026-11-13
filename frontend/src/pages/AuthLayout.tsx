import type { ReactNode } from "react";
import { Link, Navigate } from "react-router";
import { FormError } from "../components/ui";
import { useMe } from "../features/auth/hooks";

export function Wordmark({
  size = "lg",
  className = "",
}: {
  size?: "lg" | "sm" | "none";
  className?: string;
}) {
  const text = size === "lg" ? "text-5xl sm:text-6xl" : size === "sm" ? "text-xl" : "";
  return (
    <span className={`isolate font-display font-extrabold tracking-tight ${text} ${className}`}>
      <span className="relative px-[0.04em] before:absolute before:inset-x-0 before:bottom-[0.1em] before:-z-10 before:h-[0.36em] before:bg-marker">
        Knowledge
      </span>{" "}
      Ops
    </span>
  );
}

export function AuthLayout({
  title,
  intro,
  aside,
  children,
}: {
  title: string;
  intro: string;
  aside: ReactNode;
  children: ReactNode;
}) {
  const { data: user, isPending } = useMe();
  if (!isPending && user) return <Navigate to="/workspaces" replace />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <main className="flex flex-col px-5 py-6 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="Knowledge Ops home" className="whitespace-nowrap">
            <Wordmark size="sm" />
          </Link>
          <Link to="/" className="text-[15px] text-muted transition-colors hover:text-pine">
            Back to home
          </Link>
        </header>

        <section className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-8 py-14">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[44px] font-extrabold leading-[1] tracking-[-0.035em]">
              {title}
            </h1>
            <p className="text-[18px] leading-[1.5] text-ink/80">{intro}</p>
          </div>
          {!navigator.cookieEnabled ? (
            <FormError message="Signing in needs cookies. Turn them on for this site, then reload the page." />
          ) : null}
          {children}
        </section>
      </main>

      {aside}
    </div>
  );
}
