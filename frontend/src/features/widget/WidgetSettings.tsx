import { useState, type FormEvent } from "react";
import { CheckIcon, CopyIcon, GlobeIcon } from "../../components/icons";
import { Button, ConfirmButton, Field, FormError, Panel } from "../../components/ui";
import { ApiError } from "../../lib/api";
import { formatDate } from "../../lib/format";
import type { WidgetKey, WorkspaceDetail } from "../../types";
import { embedSnippet } from "./api";
import { useCreateWidgetKey, useRevokeWidgetKey, useUpdateWidgetKey, useWidgetKeys } from "./hooks";

// "one site per line" textarea → list for the API (the server normalises each address).
const toList = (text: string) =>
  text
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean);

// The API reports website problems per line ("allowedOrigins.1"); show them readably.
function websitesError(error: unknown) {
  if (!(error instanceof ApiError)) return undefined;
  const detail = error.details?.find((d) => d.path.startsWith("allowedOrigins"));
  if (!detail) return error.message;
  const line = Number(detail.path.split(".")[1]);
  return Number.isNaN(line) ? detail.message : `Line ${line + 1}: ${detail.message}`;
}

/*
 * Settings → Website widget.
 * Only public workspaces can have a widget (the server enforces this too). Each key gets
 * its own list of websites allowed to show the chat, and a snippet to paste into them.
 */
export function WidgetSettings({ workspace }: { workspace: WorkspaceDetail }) {
  const isPublic = workspace.visibility === "PUBLIC";
  const keys = useWidgetKeys(workspace.id, isPublic);

  if (!isPublic) {
    return (
      <Panel className="p-6">
        <SectionTitle />
        <p className="mt-2 text-[15px] text-ink/75">
          The website widget is available for <strong>public</strong> workspaces only. Switch this
          workspace to Public above if its documents are meant for your website's visitors.
        </p>
      </Panel>
    );
  }

  const active = (keys.data ?? []).filter((k) => !k.revokedAt);
  const revoked = (keys.data ?? []).length - active.length;

  return (
    <Panel className="p-6">
      <SectionTitle />
      <p className="mt-1 text-[15px] text-ink/75">
        Add a chat bubble to your website that answers from this workspace's documents, with
        sources. Each key works only on the websites you list.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {keys.isPending && <p className="text-sm text-muted">Loading keys…</p>}
        {keys.isError && <FormError message="Couldn't load the widget keys." />}
        {active.map((widgetKey) => (
          <KeyCard key={widgetKey.id} workspaceId={workspace.id} widgetKey={widgetKey} />
        ))}
        {keys.isSuccess && active.length === 0 && (
          <p className="rounded-md border border-dashed border-line px-4 py-5 text-center text-sm text-muted">
            No widget yet. Create a key below to get your snippet.
          </p>
        )}
        {revoked > 0 && (
          <p className="text-xs text-muted">
            {revoked} revoked {revoked === 1 ? "key" : "keys"} hidden.
          </p>
        )}
      </div>

      <CreateKeyForm workspaceId={workspace.id} />
    </Panel>
  );
}

function SectionTitle() {
  return (
    <h2 className="flex items-center gap-2 font-display text-[22px] font-bold">
      <GlobeIcon className="size-5 text-pine" />
      Website widget
    </h2>
  );
}

/* ---------- One key: its websites, snippet, edit and revoke ---------- */

function KeyCard({ workspaceId, widgetKey }: { workspaceId: string; widgetKey: WidgetKey }) {
  const update = useUpdateWidgetKey(workspaceId);
  const revoke = useRevokeWidgetKey(workspaceId);
  const [editing, setEditing] = useState(false);
  const [websites, setWebsites] = useState(widgetKey.allowedOrigins.join("\n"));

  const save = (e: FormEvent) => {
    e.preventDefault();
    update.mutate(
      { keyId: widgetKey.id, allowedOrigins: toList(websites) },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="rounded-lg border border-line bg-paper/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{widgetKey.name}</p>
          <p className="text-xs text-muted">
            Created {formatDate(widgetKey.createdAt)} ·{" "}
            {widgetKey.lastUsedAt
              ? `last used ${formatDate(widgetKey.lastUsedAt)}`
              : "not used yet"}
          </p>
        </div>
        <ConfirmButton
          label="Revoke"
          confirmLabel="Click again to revoke"
          onConfirm={() => revoke.mutate(widgetKey.id)}
          disabled={revoke.isPending}
        />
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-3 flex flex-col gap-2" noValidate>
          <WebsitesInput id={`sites-${widgetKey.id}`} value={websites} onChange={setWebsites} />
          <FormError message={websitesError(update.error)} />
          <div className="flex gap-2">
            <Button type="submit" disabled={update.isPending || toList(websites).length === 0}>
              {update.isPending ? "Saving…" : "Save websites"}
            </Button>
            <Button type="button" variant="quiet" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {widgetKey.allowedOrigins.map((origin) => (
            <span key={origin} className="rounded bg-sand px-2 py-0.5 font-mono text-[12px]">
              {origin}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-1 text-[13px] font-semibold text-pine underline-offset-2 hover:underline"
          >
            Edit websites
          </button>
        </div>
      )}

      <Snippet code={embedSnippet(widgetKey.key)} />
    </div>
  );
}

function Snippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-semibold text-muted">
        Paste this just before <code>&lt;/body&gt;</code> on your website:
      </p>
      <div className="flex items-start gap-2 rounded-md bg-ink p-3">
        <code className="min-w-0 flex-1 font-mono text-[12px] break-all text-paper/90">{code}</code>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-paper/80 hover:bg-paper/10 hover:text-paper"
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Create a key ---------- */

function CreateKeyForm({ workspaceId }: { workspaceId: string }) {
  const create = useCreateWidgetKey(workspaceId);
  const [name, setName] = useState("");
  const [websites, setWebsites] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      { name: name.trim(), allowedOrigins: toList(websites) },
      {
        onSuccess: () => {
          setName("");
          setWebsites("");
        },
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 flex flex-col gap-3 border-t border-line pt-5"
      noValidate
    >
      <h3 className="font-semibold">New widget key</h3>
      <Field
        label="Name"
        name="widget-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Help center site"
        maxLength={60}
      />
      <WebsitesInput id="new-sites" value={websites} onChange={setWebsites} />
      <FormError message={websitesError(create.error)} />
      <Button
        type="submit"
        className="self-start"
        disabled={create.isPending || !name.trim() || toList(websites).length === 0}
      >
        {create.isPending ? "Creating…" : "Create key"}
      </Button>
    </form>
  );
}

function WebsitesInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        Websites allowed to show the chat
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={"https://example.com\nhttps://help.example.com"}
        className="rounded-md border border-line bg-surface px-3 py-2.5 font-mono text-[13px] outline-none focus:border-pine"
      />
      <p className="text-xs text-muted">
        One per line. Use https:// addresses (http:// only for localhost while testing).
      </p>
    </div>
  );
}
