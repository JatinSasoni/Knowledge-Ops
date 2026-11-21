import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router";
import { CloseIcon, ListIcon } from "../components/icons";
import { Wordmark } from "./AuthLayout";
import { Sidebar } from "./shell/Sidebar";

/*
 * The app shell for every signed-in page.
 * - Large screens: a fixed sidebar on the left, the page fills the rest of the screen
 *   and scrolls on its own (the sidebar never scrolls away).
 * - Small screens: a slim top bar with a menu button that slides the sidebar in.
 */
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape closes the phone menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-paper">
      <aside className="hidden w-64 shrink-0 border-r border-line bg-sand/50 lg:block">
        <Sidebar onNavigate={() => {}} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-paper shadow-2xl"
            style={{ animation: "fade 0.15s ease-out" }}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-3 rounded-md p-1.5 text-muted hover:bg-sand hover:text-ink"
            >
              <CloseIcon />
            </button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="-ml-1 rounded-md p-1.5 text-muted hover:bg-sand hover:text-ink"
          >
            <ListIcon className="size-5" />
          </button>
          <Link to="/workspaces" aria-label="Your workspaces">
            <Wordmark />
          </Link>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
