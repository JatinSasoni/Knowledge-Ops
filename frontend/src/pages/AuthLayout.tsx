import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useMe } from "../features/auth/hooks";

export function Wordmark({ size = "lg" }: { size?: "lg" | "sm" }) {
  const text = size === "lg" ? "text-5xl sm:text-6xl" : "text-xl";
  return (
    <span className={`font-display font-extrabold tracking-tight ${text}`}>
      <span className="bg-[linear-gradient(transparent_58%,var(--color-marker)_58%,var(--color-marker)_92%,transparent_92%)] px-0.5">
        Knowledge
      </span>{" "}
      Ops
    </span>
  );
}

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  const { data: user, isPending } = useMe();
  if (!isPending && user) return <Navigate to="/workspaces" replace />;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-10 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Wordmark />
        <p className="text-muted">Your team's documents, searchable and answerable in one place.</p>
      </div>
      <section className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {children}
      </section>
    </main>
  );
}
