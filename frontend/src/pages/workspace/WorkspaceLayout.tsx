import { Link, NavLink, Outlet, useParams } from "react-router";
import {
  ChatIcon,
  ChevronRightIcon,
  DocumentIcon,
  SettingsIcon,
  UsersIcon,
} from "../../components/icons";
import { FormError, RoleBadge } from "../../components/ui";
import { useWorkspace } from "../../features/workspaces/hooks";
import { ApiError } from "../../lib/api";
import type { WorkspaceContext } from "./context";

/*
 * Layout
 * - Large screens: a sidebar on the left (workspace + sections), the page on the right.
 * - Small screens: the same nav becomes a compact header with a row of tabs that
 *   scrolls sideways.
 */

const navItem = ({ isActive }: { isActive: boolean }) =>
  `group relative flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-semibold whitespace-nowrap transition-colors ${
    isActive
      ? "bg-surface text-ink shadow-sm ring-1 ring-line lg:before:absolute lg:before:inset-y-2 lg:before:left-0 lg:before:w-[3px] lg:before:rounded-full lg:before:bg-pine"
      : "text-muted hover:bg-surface/60 hover:text-ink"
  }`;

export function WorkspaceLayout() {
  const { workspaceId = "" } = useParams();
  const query = useWorkspace(workspaceId);

  if (query.isPending) return <p className="text-muted">Loading workspace…</p>;

  if (query.isError) {
    // The API answers 404 both for "doesn't exist" and "you're not a member" (and 400 for
    // a malformed id), so the page can't leak which workspaces exist.
    const missing =
      query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <h1 className="font-display text-[36px] leading-none font-extrabold">
          {missing ? "Workspace not found" : "Couldn't load this workspace"}
        </h1>
        {missing ? (
          <p className="text-ink/75">It may have been deleted, or you're not a member of it.</p>
        ) : (
          <FormError message={query.error.message} />
        )}
        <Link to="/workspaces" className="font-semibold text-pine underline underline-offset-4">
          Back to your workspaces
        </Link>
      </div>
    );
  }

  const workspace = query.data;
  const isAdmin = workspace.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <Link
          to="/workspaces"
          className="flex items-center gap-1 text-[13px] text-muted hover:text-pine"
        >
          <ChevronRightIcon className="size-3.5 rotate-180" />
          All workspaces
        </Link>

        {/* Which workspace you're in */}
        <div className="flex items-center gap-3 lg:rounded-xl lg:border lg:border-line lg:bg-surface lg:p-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pine font-display text-[18px] font-extrabold text-paper"
          >
            {workspace.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-[19px] leading-tight font-extrabold tracking-tight">
              {workspace.name}
            </h1>
            <div className="mt-1">
              <RoleBadge role={workspace.role} />
            </div>
          </div>
        </div>

        {/* Sections */}
        <nav
          aria-label="Workspace sections"
          className="-mx-1 flex gap-1 overflow-x-auto overflow-y-hidden px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:p-0"
        >
          <NavLink to="" end className={navItem}>
            <DocumentIcon />
            Documents
            <Count n={workspace._count.documents} />
          </NavLink>
          <NavLink to="chat" className={navItem}>
            <ChatIcon />
            Ask
          </NavLink>
          <NavLink to="members" className={navItem}>
            <UsersIcon />
            Members
            <Count n={workspace._count.members} />
          </NavLink>
          {isAdmin ? (
            <NavLink to="settings" className={navItem}>
              <SettingsIcon />
              Settings
            </NavLink>
          ) : null}
        </nav>
      </aside>

      <div className="min-w-0">
        <Outlet context={{ workspace } satisfies WorkspaceContext} />
      </div>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="ml-auto rounded-full bg-sand px-1.5 py-px text-[11px] font-semibold text-muted tabular-nums">
      {n}
    </span>
  );
}
