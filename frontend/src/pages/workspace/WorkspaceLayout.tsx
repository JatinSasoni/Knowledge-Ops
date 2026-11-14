import { Link, NavLink, Outlet, useParams } from "react-router";
import { FormError, RoleBadge } from "../../components/ui";
import { useWorkspace } from "../../features/workspaces/hooks";
import { ApiError } from "../../lib/api";
import { plural } from "../../lib/format";
import type { WorkspaceContext } from "./context";

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-4 py-2 text-[15px] font-semibold transition-colors ${
    isActive ? "bg-ink text-paper" : "text-muted hover:bg-sand hover:text-ink"
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
        <h1 className="font-display text-[36px] font-extrabold leading-none">
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link to="/workspaces" className="text-sm text-muted hover:text-pine">
          Workspaces
        </Link>
        <h1 className="font-display text-[clamp(36px,4.5vw,56px)] font-extrabold leading-none tracking-[-0.035em] break-words">
          {workspace.name}
        </h1>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-ink/75">
          <RoleBadge role={workspace.role} />
          <span>{plural(workspace._count.members, "member")}</span>
          <span>{plural(workspace._count.documents, "document")}</span>
        </p>
      </div>

      <nav aria-label="Workspace sections" className="flex flex-wrap gap-1">
        <NavLink to="" end className={tab}>
          Documents
        </NavLink>
        <NavLink to="members" className={tab}>
          Members
        </NavLink>
        {isAdmin ? (
          <NavLink to="settings" className={tab}>
            Settings
          </NavLink>
        ) : null}
      </nav>

      <Outlet context={{ workspace } satisfies WorkspaceContext} />
    </div>
  );
}
