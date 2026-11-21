import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { Button, Field, FormError, Panel } from "../../components/ui";
import {
  useChangeVisibility,
  useDeleteWorkspace,
  useRenameWorkspace,
} from "../../features/workspaces/hooks";
import { VisibilityPicker } from "../../features/workspaces/Visibility";
import { fieldError } from "../../lib/api";
import type { Visibility } from "../../types";
import { useWorkspaceContext } from "./context";

/*
 * Who can ask questions: Private or Public.
 * Making a workspace public exposes every document in it to website visitors, so that
 * direction needs an explicit "I understand" tick. Going back to private needs none:
 * it only removes access (the widget stops answering right away).
 */
function VisibilitySettings() {
  const { workspace } = useWorkspaceContext();
  const change = useChangeVisibility(workspace.id);
  const [choice, setChoice] = useState<Visibility>(workspace.visibility);
  const [understood, setUnderstood] = useState(false);

  const unchanged = choice === workspace.visibility;
  const goingPublic = !unchanged && choice === "PUBLIC";

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    change.mutate(choice, { onSuccess: () => setUnderstood(false) });
  };

  return (
    <Panel className="p-6">
      <h2 className="font-display text-[22px] font-bold">Visibility</h2>
      <form onSubmit={onSave} className="mt-4 flex flex-col gap-4" noValidate>
        <VisibilityPicker
          value={choice}
          onChange={(value) => {
            setChoice(value);
            setUnderstood(false);
          }}
        />

        {goingPublic && (
          <label className="flex items-start gap-3 rounded-md border border-marker bg-marker/15 p-3 text-[14px]">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--color-pine)]"
            />
            <span>
              I understand that <strong>everything in this workspace</strong> can be found by
              visitors to our website once the widget is added. Internal documents should stay in a
              private workspace.
            </span>
          </label>
        )}
        {!unchanged && choice === "PRIVATE" && (
          <p className="text-[14px] text-muted">
            The website widget will stop answering right away. You can make it public again later.
          </p>
        )}

        <FormError message={change.isError ? change.error.message : undefined} />
        <Button
          type="submit"
          className="self-start"
          disabled={unchanged || change.isPending || (goingPublic && !understood)}
        >
          {change.isPending
            ? "Saving…"
            : change.isSuccess && unchanged
              ? "Saved"
              : "Save visibility"}
        </Button>
      </form>
    </Panel>
  );
}

export function SettingsTab() {
  const { workspace } = useWorkspaceContext();
  const rename = useRenameWorkspace(workspace.id);
  const del = useDeleteWorkspace(workspace.id);
  const navigate = useNavigate();
  const [name, setName] = useState(workspace.name);
  const [confirmText, setConfirmText] = useState("");

  // The tab is hidden for members; this covers someone typing the URL. The API refuses anyway.
  if (workspace.role !== "ADMIN") return <Navigate to=".." relative="path" replace />;

  const onRename = (e: FormEvent) => {
    e.preventDefault();
    rename.mutate(name.trim());
  };

  const onDelete = (e: FormEvent) => {
    e.preventDefault();
    del.mutate(undefined, { onSuccess: () => navigate("/workspaces", { replace: true }) });
  };

  const unchanged = name.trim() === workspace.name;

  return (
    <div className="grid max-w-3xl gap-6">
      <Panel className="p-6">
        <h2 className="font-display text-[22px] font-bold">Rename</h2>
        <form
          onSubmit={onRename}
          className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end"
          noValidate
        >
          <div className="flex-1">
            <Field
              label="Workspace name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              error={fieldError(rename.error, "name")}
            />
          </div>
          <Button type="submit" disabled={rename.isPending || unchanged || name.trim().length < 2}>
            {rename.isPending ? "Saving…" : rename.isSuccess && unchanged ? "Saved" : "Save name"}
          </Button>
        </form>
        <p className="mt-3 text-sm text-muted">
          The workspace's address stays the same, so links keep working.
        </p>
      </Panel>

      <VisibilitySettings />

      <Panel className="border border-danger/30 p-6">
        <h2 className="font-display text-[22px] font-bold text-danger">Delete this workspace</h2>
        <p className="mt-1 text-[15px] text-ink/80">
          This removes every document and member in it for everyone. It can't be undone.
        </p>
        <form onSubmit={onDelete} className="mt-4 flex flex-col gap-3" noValidate>
          <label htmlFor="confirm-delete" className="text-sm font-medium">
            Type <span className="font-bold">{workspace.name}</span> to confirm
          </label>
          <input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            className="rounded-md border border-line bg-surface px-3 py-2.5 outline-none focus:border-danger"
          />
          <FormError message={del.isError ? del.error.message : undefined} />
          <button
            type="submit"
            disabled={confirmText !== workspace.name || del.isPending}
            className="self-start rounded-md bg-danger px-4 py-2.5 text-sm font-semibold text-paper transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {del.isPending ? "Deleting…" : "Delete workspace"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
