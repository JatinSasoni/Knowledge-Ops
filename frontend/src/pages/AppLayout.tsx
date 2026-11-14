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
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3 md:px-10">
          <Link to="/workspaces" aria-label="Your workspaces" className="whitespace-nowrap">
            <Wordmark size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <Button variant="quiet" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-10 lg:py-14">
        <Outlet />
      </main>
    </div>
  );
}
