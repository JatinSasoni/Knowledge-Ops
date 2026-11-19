import { Link, NavLink } from "react-router";
import type { ConversationSummary } from "../../types";
import { CloseIcon, PlusIcon } from "../../components/icons";

// "Today", "Yesterday", "Previous 7 days", "Older", based on the last message time.
function groupByDate(conversations: ConversationSummary[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const day = 24 * 60 * 60 * 1000;

  const today = startOfToday.getTime();

  const labelFor = (updatedAt: string) => {
    const time = new Date(updatedAt).getTime();
    if (time >= today) return "Today";
    if (time >= today - day) return "Yesterday";
    if (time >= today - 7 * day) return "Previous 7 days";
    return "Older";
  };

  // The list arrives newest first, so the groups come out in the right order too.
  const groups = new Map<string, ConversationSummary[]>();
  for (const conversation of conversations) {
    const label = labelFor(conversation.updatedAt);
    groups.set(label, [...(groups.get(label) ?? []), conversation]);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}

export function ConversationList({
  workspaceId,
  conversations,
  isLoading,
  isError,
  open,
  onClose,
}: {
  workspaceId: string;
  conversations: ConversationSummary[];
  isLoading: boolean;
  isError: boolean;
  open: boolean; // small screens only: the list covers the chat when open
  onClose: () => void;
}) {
  const base = `/workspaces/${workspaceId}/chat`;

  const item = ({ isActive }: { isActive: boolean }) =>
    `relative block rounded-lg px-3 py-2 text-[14px] transition-colors ${
      isActive
        ? "bg-surface font-semibold text-ink shadow-sm ring-1 ring-line before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-pine"
        : "text-ink/75 hover:bg-surface/70 hover:text-ink"
    }`;

  return (
    <aside
      aria-label="Conversations"
      className={`${open ? "flex" : "hidden"} absolute inset-0 z-20 w-full flex-col border-r border-line bg-sand/95 backdrop-blur lg:static lg:flex lg:w-64 lg:shrink-0 lg:bg-sand/40`}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">Chats</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chats"
          className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink lg:hidden"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-3">
        <Link
          to={base}
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-lg bg-pine px-3 py-2.5 text-sm font-semibold text-paper shadow-sm transition-colors hover:bg-pine-dark"
        >
          <PlusIcon />
          New chat
        </Link>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto px-3 pb-4">
        {isLoading && (
          <ul className="flex flex-col gap-2 px-1 pt-2" aria-label="Loading">
            {[70, 55, 80, 45].map((width) => (
              <li
                key={width}
                className="h-4 animate-pulse rounded bg-line/70"
                style={{ width: `${width}%` }}
              />
            ))}
          </ul>
        )}
        {isError && <p className="px-2 pt-2 text-sm text-danger">Couldn't load your chats.</p>}
        {!isLoading && !isError && conversations.length === 0 && (
          <p className="px-2 pt-2 text-sm leading-relaxed text-muted">
            No chats yet. Your questions and answers will be saved here.
          </p>
        )}

        {groupByDate(conversations).map((group) => (
          <div key={group.label} className="mt-3 first:mt-1">
            <p className="px-3 pb-1 text-[11px] font-semibold text-muted">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((conversation) => (
                <li key={conversation.id}>
                  <NavLink
                    to={`${base}/${conversation.id}`}
                    onClick={onClose}
                    className={item}
                    title={conversation.title}
                  >
                    <span className="block truncate">{conversation.title}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
