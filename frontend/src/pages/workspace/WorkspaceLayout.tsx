import type { ReactNode } from "react";
import { Link, Outlet, useLocation, useMatch, useParams } from "react-router";
import { FormError } from "../../components/ui";
import { useWorkspace } from "../../features/workspaces/hooks";
import { ApiError } from "../../lib/api";
import type { WorkspaceContext } from "./context";

// Title and one-line description for each section's page header.
const SECTIONS = {
  documents: {
    title: "Documents",
    description:
      "Upload files and follow their processing. Ready documents can be searched and asked about.",
  },
  members: {
    title: "Members",
    description:
      "Everyone here can read the documents and ask questions. Admins manage members and settings.",
  },
  settings: {
    title: "Settings",
    description: "Rename this workspace, or delete it with everything in it.",
  },
};

/*
 * Loads the workspace once for all its pages (they read it with useWorkspaceContext).
 * Navigation lives in the app sidebar. Here:
 * - Ask (chat) fills the whole area, edge to edge, with no page header.
 * - Every other section gets a page header and a centered content column.
 */
export function WorkspaceLayout() {
  const { workspaceId = "" } = useParams();
  const query = useWorkspace(workspaceId);
  const isChat = useMatch("/workspaces/:workspaceId/chat/*");
  const { pathname } = useLocation();

  if (query.isPending) {
    return (
      <Page>
        <div className="flex flex-col gap-3" aria-label="Loading workspace">
          <div className="h-4 w-24 animate-pulse rounded bg-sand" />
          <div className="h-9 w-56 animate-pulse rounded bg-sand" />
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-sand/70" />
        </div>
      </Page>
    );
  }

  if (query.isError) {
    // The API answers 404 both for "doesn't exist" and "you're not a member" (and 400 for
    // a malformed id), so the page can't leak which workspaces exist.
    const missing =
      query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
    return (
      <Page>
        <div className="flex max-w-xl flex-col gap-4">
          <h1 className="font-display text-[32px] leading-tight font-extrabold tracking-tight">
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
      </Page>
    );
  }

  const workspace = query.data;
  const context = { workspace } satisfies WorkspaceContext;

  if (isChat) {
    return (
      <div className="h-full">
        <Outlet context={context} />
      </div>
    );
  }

  const section = pathname.endsWith("/members")
    ? SECTIONS.members
    : pathname.endsWith("/settings")
      ? SECTIONS.settings
      : SECTIONS.documents;

  return (
    <Page>
      <header className="mb-8 border-b border-line pb-6">
        <p className="text-[13px] font-medium text-muted">{workspace.name}</p>
        <h1 className="mt-1 font-display text-[clamp(26px,3vw,34px)] leading-tight font-extrabold tracking-tight">
          {section.title}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/70">{section.description}</p>
      </header>
      <Outlet context={context} />
    </Page>
  );
}

// The centered content column used by normal (non-chat) pages.
function Page({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
  );
}
