import { Link, Outlet } from "react-router";
import { Button } from "../components/ui";
import { useLogout, useMe } from "../features/auth/hooks";
import { Wordmark } from "./AuthLayout";

export function AppLayout() {
  const { data: user } = useMe();
  const logout = useLogout();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/workspaces" aria-label="Knowledge Ops home">
            <Wordmark size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <Button variant="quiet" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
