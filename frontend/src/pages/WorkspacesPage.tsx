import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button, Field, FormError, Panel, RoleBadge } from "../components/ui";
import { PENDING_WORKSPACE_KEY } from "../features/home/layout";
import { useCreateWorkspace, useWorkspaces } from "../features/workspaces/hooks";
import { fieldError } from "../lib/api";
import { formatDate } from "../lib/format";

function takePendingName() {
  try {
    return sessionStorage.getItem(PENDING_WORKSPACE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function WorkspacesPage() {
  const workspaces = useWorkspaces();
  const create = useCreateWorkspace();
  const navigate = useNavigate();
  // A name typed on the home page ("Name your first workspace ...") is waiting here.
  const [name, setName] = useState(takePendingName);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(name.trim(), {
      onSuccess: (workspace) => {
        try {
          sessionStorage.removeItem(PENDING_WORKSPACE_KEY);
        } catch {
          /* nothing stored */
        }
        navigate(`/workspaces/${workspace.id}`);
      },
    });
  };

  const list = workspaces.data ?? [];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[44px] font-extrabold leading-none tracking-[-0.035em]">
            Your workspaces
          </h1>
          <p className="text-[17px] text-ink/75">
            Each workspace keeps one team's documents and members separate from every other.
          </p>
        </div>

        {workspaces.isPending ? (
          <p className="text-muted">Loading your workspaces…</p>
        ) : workspaces.isError ? (
          <FormError message={`Couldn't load your workspaces: ${workspaces.error.message}`} />
        ) : list.length === 0 ? (
          <Panel className="px-6 py-8">
            <p className="font-display text-[22px] font-bold">No workspaces yet</p>
            <p className="mt-1 text-muted">
              Create one for your team, or ask a workspace admin to add your email.
            </p>
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            <ul>
              {list.map((w, i) => (
                <li key={w.id} className={i > 0 ? "border-t border-line" : ""}>
                  <Link
                    to={`/workspaces/${w.id}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper/60"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-pine font-display text-[18px] font-bold text-paper">
                      {w.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[17px] font-semibold group-hover:text-pine">
                        {w.name}
                      </span>
                      <span className="text-sm text-muted">Created {formatDate(w.createdAt)}</span>
                    </span>
                    <span className="ml-auto">
                      <RoleBadge role={w.role} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <aside className="lg:col-span-5">
        <Panel className="bg-sand p-6">
          <h2 className="font-display text-[24px] font-bold">Create a workspace</h2>
          <p className="mt-1 text-[15px] text-ink/75">
            You'll be its admin and can add people next.
          </p>
          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
            <Field
              label="Workspace name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Support team"
              maxLength={60}
              required
              error={fieldError(create.error, "name")}
              hint="2 to 60 characters."
            />
            <FormError
              message={
                create.isError && !fieldError(create.error, "name")
                  ? create.error.message
                  : undefined
              }
            />
            <Button type="submit" disabled={create.isPending || name.trim().length < 2}>
              {create.isPending ? "Creating…" : "Create workspace"}
            </Button>
          </form>
        </Panel>
      </aside>
    </div>
  );
}
