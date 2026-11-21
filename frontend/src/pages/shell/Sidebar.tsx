import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useMatch } from "react-router";
import {
  ChatIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  DocumentIcon,
  GridIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
} from "../../components/icons";
import { useLogout, useMe } from "../../features/auth/hooks";
import { useWorkspace, useWorkspaces } from "../../features/workspaces/hooks";
import { Wordmark } from "../AuthLayout";

/*
 * The app's left sidebar, on every signed-in page:
 *   logo → workspace switcher → section links → your account
 * `onNavigate` lets the phone drawer close itself after a link is clicked.
 */
export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  // Which workspace (if any) the URL is inside. useMatch works from this layout level,
  // where the child route's params aren't available yet.
  const workspaceId = useMatch("/workspaces/:workspaceId/*")?.params.workspaceId;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Link to="/workspaces" onClick={onNavigate} aria-label="Citely, your workspaces">
          <Wordmark />
        </Link>
      </div>

      <div className="px-3">
        <WorkspaceSwitcher currentId={workspaceId} onNavigate={onNavigate} />
      </div>

      <nav aria-label="Main" className="mt-5 flex-1 overflow-y-auto px-3">
        {workspaceId ? (
          <WorkspaceLinks workspaceId={workspaceId} onNavigate={onNavigate} />
        ) : (
          <NavLink to="/workspaces" end onClick={onNavigate} className={navItem}>
            <GridIcon />
            Workspaces
          </NavLink>
        )}
      </nav>

      <Account />
    </div>
  );
}

const navItem = ({ isActive }: { isActive: boolean }) =>
  `relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
    isActive
      ? "bg-surface text-ink shadow-sm ring-1 ring-line before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-pine"
      : "text-ink/70 hover:bg-surface/60 hover:text-ink"
  }`;

/* ---------- Sections of the current workspace ---------- */

function WorkspaceLinks({
  workspaceId,
  onNavigate,
}: {
  workspaceId: string;
  onNavigate: () => void;
}) {
  // Same query as the workspace page, so this is read from the cache, not fetched twice.
  const workspace = useWorkspace(workspaceId).data;
  const base = `/workspaces/${workspaceId}`;

  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-2 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
        Workspace
      </p>
      <NavLink to={base} end onClick={onNavigate} className={navItem}>
        <DocumentIcon />
        Documents
        {workspace && <Count n={workspace._count.documents} />}
      </NavLink>
      <NavLink to={`${base}/chat`} onClick={onNavigate} className={navItem}>
        <ChatIcon />
        Ask
      </NavLink>
      <NavLink to={`${base}/members`} onClick={onNavigate} className={navItem}>
        <UsersIcon />
        Members
        {workspace && <Count n={workspace._count.members} />}
      </NavLink>
      {workspace?.role === "ADMIN" && (
        <NavLink to={`${base}/settings`} onClick={onNavigate} className={navItem}>
          <SettingsIcon />
          Settings
        </NavLink>
      )}
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

/* ---------- Workspace switcher (a small dropdown) ---------- */

function WorkspaceSwitcher({
  currentId,
  onNavigate,
}: {
  currentId: string | undefined;
  onNavigate: () => void;
}) {
  const workspaces = useWorkspaces().data ?? [];
  const current = workspaces.find((w) => w.id === currentId);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Close on a click outside the dropdown, or on Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = () => {
    setOpen(false);
    onNavigate();
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-2.5 text-left shadow-sm transition-colors hover:border-pine/40"
      >
        <Avatar name={current?.name ?? "?"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">
            {current?.name ?? "Choose a workspace"}
          </span>
          <span className="block text-xs text-muted">
            {current
              ? `${current.role === "ADMIN" ? "Admin" : "Member"} · ${current.visibility === "PUBLIC" ? "Public" : "Private"}`
              : "Switch workspace"}
          </span>
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
          style={{ animation: "fade 0.12s ease-out" }}
        >
          <p className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
            Workspaces
          </p>
          <ul className="max-h-64 overflow-y-auto p-1.5">
            {workspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  role="menuitem"
                  to={`/workspaces/${workspace.id}`}
                  onClick={pick}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[14px] hover:bg-sand/60"
                >
                  <Avatar name={workspace.name} small />
                  <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                  {workspace.id === currentId && <CheckIcon className="size-4 text-pine" />}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-col border-t border-line p-1.5">
            <Link
              role="menuitem"
              to="/workspaces"
              onClick={pick}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-[14px] text-ink/80 hover:bg-sand/60"
            >
              <GridIcon className="size-4 text-muted" />
              All workspaces
            </Link>
            <Link
              role="menuitem"
              to="/workspaces?new=1"
              onClick={pick}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-[14px] text-ink/80 hover:bg-sand/60"
            >
              <PlusIcon className="size-4 text-muted" />
              New workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-lg bg-pine font-display font-extrabold text-paper ${
        small ? "size-6 text-[12px]" : "size-9 text-[16px]"
      }`}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

/* ---------- You (bottom of the sidebar) ---------- */

function Account() {
  const { data: user } = useMe();
  const logout = useLogout();

  return (
    <div className="flex items-center gap-3 border-t border-line px-4 py-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-paper"
      >
        {user?.email.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-ink/80" title={user?.email}>
        {user?.email}
      </span>
      <button
        type="button"
        onClick={() => void logout()}
        aria-label="Sign out"
        title="Sign out"
        className="rounded-md p-1.5 text-muted transition-colors hover:bg-sand hover:text-ink"
      >
        <LogOutIcon />
      </button>
    </div>
  );
}
