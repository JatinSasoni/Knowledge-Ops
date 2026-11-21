import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Dialog } from "../components/Dialog";
import { ArrowRightIcon, GridIcon, PlusIcon } from "../components/icons";
import { Button, Field, FormError, RoleBadge } from "../components/ui";
import { PENDING_WORKSPACE_KEY } from "../features/home/layout";
import { useCreateWorkspace, useWorkspaces } from "../features/workspaces/hooks";
import { fieldError } from "../lib/api";
import { formatDate } from "../lib/format";
import type { Visibility } from "../types";
import { VisibilityBadge, VisibilityPicker } from "../features/workspaces/Visibility";
import { Avatar } from "./shell/Sidebar";

function takePendingName() {
  try {
    return sessionStorage.getItem(PENDING_WORKSPACE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function WorkspacesPage() {
  const workspaces = useWorkspaces();
  const list = workspaces.data ?? [];

  /*
   * The "create" dialog is open when:
   * - the URL has ?new=1 (the sidebar's "New workspace" link), or
   * - a name typed on the home page is waiting ("Name your first workspace…"), or
   * - the "New workspace" button here was clicked.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingName] = useState(takePendingName);
  const [open, setOpen] = useState(pendingName !== "");
  const dialogOpen = open || searchParams.has("new");

  function openDialog() {
    setOpen(true);
  }
  function closeDialog() {
    setOpen(false);
    if (searchParams.has("new")) setSearchParams({}, { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-[clamp(26px,3vw,34px)] leading-tight font-extrabold tracking-tight">
            Workspaces
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/70">
            Each workspace keeps one team's documents, chats and members separate from every other.
          </p>
        </div>
        <Button onClick={openDialog} className="flex items-center gap-2">
          <PlusIcon />
          New workspace
        </Button>
      </header>

      {workspaces.isPending ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading workspaces">
          {[1, 2, 3].map((n) => (
            <li key={n} className="h-44 animate-pulse rounded-xl bg-sand/70" />
          ))}
        </ul>
      ) : workspaces.isError ? (
        <FormError message={`Couldn't load your workspaces: ${workspaces.error.message}`} />
      ) : list.length === 0 ? (
        <EmptyState onCreate={openDialog} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((workspace) => (
            <li key={workspace.id}>
              <Link
                to={`/workspaces/${workspace.id}`}
                className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-pine/40 hover:shadow-[0_16px_40px_-24px_rgba(18,22,18,0.45)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <Avatar name={workspace.name} />
                  <span className="flex items-center gap-1.5">
                    <VisibilityBadge visibility={workspace.visibility} />
                    <RoleBadge role={workspace.role} />
                  </span>
                </div>
                <p className="mt-4 truncate text-[17px] font-semibold">{workspace.name}</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  Created {formatDate(workspace.createdAt)}
                </p>
                <span className="mt-auto flex items-center gap-1.5 border-t border-line pt-4 text-[13px] font-semibold text-pine">
                  Open workspace
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title="Create a workspace"
        description="You'll be its admin and can add people next. You can change who can ask later in Settings."
      >
        {/* Mounted only while open, so it starts fresh each time. */}
        {dialogOpen && <CreateWorkspaceForm initialName={pendingName} onCancel={closeDialog} />}
      </Dialog>
    </div>
  );
}

function CreateWorkspaceForm({
  initialName,
  onCancel,
}: {
  initialName: string;
  onCancel: () => void;
}) {
  const create = useCreateWorkspace();
  const navigate = useNavigate();
  const [name, setName] = useState(initialName);
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE"); // safe default

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      { name: name.trim(), visibility },
      {
        onSuccess: (workspace) => {
          try {
            sessionStorage.removeItem(PENDING_WORKSPACE_KEY);
          } catch {
            /* nothing stored */
          }
          navigate(`/workspaces/${workspace.id}`);
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field
        label="Workspace name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Support team"
        maxLength={60}
        required
        autoFocus
        error={fieldError(create.error, "name")}
        hint="2 to 60 characters."
      />
      <VisibilityPicker value={visibility} onChange={setVisibility} />
      <FormError
        message={
          create.isError && !fieldError(create.error, "name") ? create.error.message : undefined
        }
      />
      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending || name.trim().length < 2}>
          {create.isPending ? "Creating…" : "Create workspace"}
        </Button>
      </div>
    </form>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-pine text-paper">
        <GridIcon className="size-6" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold">No workspaces yet</h2>
      <p className="mt-2 max-w-sm text-[15px] text-ink/70">
        Create one for your team, or ask a workspace admin to add your email.
      </p>
      <Button onClick={onCreate} className="mt-6 flex items-center gap-2">
        <PlusIcon />
        Create your first workspace
      </Button>
    </div>
  );
}
