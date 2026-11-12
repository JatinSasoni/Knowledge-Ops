import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="font-display text-3xl font-semibold">This page doesn't exist</h1>
      <p className="text-muted">The link may be old, or the address has a typo.</p>
      <Link to="/workspaces" className="font-semibold text-pine underline underline-offset-4">
        Go to your workspaces
      </Link>
    </main>
  );
}
