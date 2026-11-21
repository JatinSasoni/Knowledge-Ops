import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { FormError } from "../../components/ui";
import { Answer, Sources } from "../../features/chat/Answer";
import { Composer } from "../../features/chat/Composer";
import { ConversationList } from "../../features/chat/ConversationList";
import { useAsk, useConversations, useMessages } from "../../features/chat/hooks";
import { AssistantMark, CheckIcon, CopyIcon, ListIcon, PlusIcon } from "../../components/icons";
import { SourceDrawer } from "../../features/chat/SourceDrawer";
import { ApiError } from "../../lib/api";
import type { ChatMessage, Citation } from "../../types";
import { useWorkspaceContext } from "./context";

// URL: /workspaces/:id/chat (new chat) or /workspaces/:id/chat/:conversationId
export function ChatTab() {
  const { workspace } = useWorkspaceContext();
  const { conversationId } = useParams();
  const conversations = useConversations(workspace.id);
  const [listOpen, setListOpen] = useState(false); // small screens only

  const title = conversationId
    ? (conversations.data?.find((c) => c.id === conversationId)?.title ?? "Conversation")
    : "New chat";

  return (
    // Fills the whole area next to the app sidebar: chats on the left, the conversation
    // on the right. Each column scrolls on its own, so the question box is always visible.
    <div className="relative flex h-full overflow-hidden bg-surface">
      <ConversationList
        workspaceId={workspace.id}
        conversations={conversations.data ?? []}
        isLoading={conversations.isPending}
        isError={conversations.isError}
        open={listOpen}
        onClose={() => setListOpen(false)}
      />
      {/* key: a different conversation gets a fresh thread (and stops any running answer) */}
      <ChatThread
        key={conversationId ?? "new"}
        workspaceId={workspace.id}
        conversationId={conversationId}
        title={title}
        hasDocuments={workspace._count.documents > 0}
        onOpenList={() => setListOpen(true)}
      />
    </div>
  );
}

function ChatThread({
  workspaceId,
  conversationId,
  title,
  hasDocuments,
  onOpenList,
}: {
  workspaceId: string;
  conversationId: string | undefined;
  title: string;
  hasDocuments: boolean;
  onOpenList: () => void;
}) {
  const navigate = useNavigate();
  const messages = useMessages(workspaceId, conversationId);
  const { ask, stop, turn, isAnswering, error } = useAsk(workspaceId, conversationId, (id) =>
    navigate(`/workspaces/${workspaceId}/chat/${id}`, { replace: true }),
  );

  const [draft, setDraft] = useState("");
  const [openSource, setOpenSource] = useState<Citation | null>(null);
  const closeSource = useCallback(() => setOpenSource(null), []);

  /*
   * Scrolling (inside the message area, not the page)
   * - `following` = "keep the newest text in view". Only the reader's own scrolling
   *   changes it: scroll up to re-read and we stop pulling you down; scroll back to
   *   the bottom and we follow again. Sending a question turns it back on.
   */
  const scroller = useRef<HTMLDivElement>(null);
  const following = useRef(true);

  function onScroll() {
    const box = scroller.current!;
    following.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  }

  const savedCount = messages.data?.length ?? 0;
  useEffect(() => {
    const box = scroller.current;
    if (box && following.current) box.scrollTop = box.scrollHeight;
  }, [turn, savedCount]);

  function send(question: string) {
    const text = question.trim();
    if (!text || isAnswering) return;
    setDraft("");
    following.current = true;
    ask(text);
  }

  const notFound =
    messages.error instanceof ApiError &&
    (messages.error.status === 404 || messages.error.status === 400);
  const saved = messages.data ?? [];
  const isEmpty = !conversationId && saved.length === 0 && !turn;

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenList}
          aria-label="Show chats"
          className="-ml-1 rounded-md p-1.5 text-muted hover:bg-sand hover:text-ink lg:hidden"
        >
          <ListIcon className="size-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</h2>
        {isAnswering && (
          <span className="flex items-center gap-2 text-xs font-medium text-pine">
            <span className="size-1.5 animate-pulse rounded-full bg-pine" />
            Answering
          </span>
        )}
        <Link
          to={`/workspaces/${workspaceId}/chat`}
          aria-label="New chat"
          className="rounded-md p-1.5 text-muted hover:bg-sand hover:text-ink lg:hidden"
        >
          <PlusIcon className="size-5" />
        </Link>
      </header>

      {/* Messages */}
      <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          {conversationId && messages.isPending && <ThreadSkeleton />}
          {notFound && <FormError message="This conversation doesn't exist, or isn't yours." />}
          {messages.isError && !notFound && (
            <FormError message="Couldn't load this conversation." />
          )}

          {isEmpty && <EmptyState hasDocuments={hasDocuments} onPick={send} />}

          <ol className="flex flex-col gap-8">
            {saved.map((message) => (
              <SavedMessage key={message.id} message={message} onCite={setOpenSource} />
            ))}

            {turn && (
              <>
                <UserMessage text={turn.question} />
                <AssistantMessage live>
                  {turn.answer ? (
                    <>
                      <Answer
                        content={turn.answer}
                        citations={turn.citations}
                        onCite={setOpenSource}
                        streaming={isAnswering}
                      />
                      <Sources
                        content={turn.answer}
                        citations={turn.citations}
                        onCite={setOpenSource}
                      />
                    </>
                  ) : isAnswering ? (
                    <Thinking steps={turn.steps} />
                  ) : null}
                </AssistantMessage>
              </>
            )}
          </ol>

          {error && (
            <div className="mt-6">
              <FormError message={error.message} />
            </div>
          )}
        </div>
      </div>

      {/* Question box */}
      <div className="shrink-0 px-4 pt-2 pb-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => send(draft)}
            onStop={stop}
            isAnswering={isAnswering}
          />
        </div>
      </div>

      <SourceDrawer citation={openSource} onClose={closeSource} />
    </section>
  );
}

/* ---------- Pieces ---------- */

/*
 * One stored message. Wrapped in memo() because the thread re-renders about 40 times a
 * second while an answer is typing (the typewriter updates state every 25 ms). Without
 * memo, every earlier answer would re-parse its Markdown on each of those renders.
 * With memo, React skips a message whose props haven't changed: `message` is the same
 * object from the query cache, and `onCite` is a state setter, which never changes.
 */
const SavedMessage = memo(function SavedMessage({
  message,
  onCite,
}: {
  message: ChatMessage;
  onCite: (citation: Citation) => void;
}) {
  if (message.role === "USER") return <UserMessage text={message.content} />;

  const citations = message.citations ?? [];
  return (
    <AssistantMessage>
      <Answer content={message.content} citations={citations} onCite={onCite} />
      <Sources content={message.content} citations={citations} onCite={onCite} />
      <CopyButton text={message.content} />
    </AssistantMessage>
  );
});

function UserMessage({ text }: { text: string }) {
  return (
    <li className="chat-enter flex justify-end">
      <p className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15.5px] leading-relaxed whitespace-pre-wrap text-paper">
        {text}
      </p>
    </li>
  );
}

function AssistantMessage({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return (
    <li className="chat-enter group flex gap-3 sm:gap-4" aria-live={live ? "polite" : undefined}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-pine text-paper">
        <AssistantMark className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1 pt-1">{children}</div>
    </li>
  );
}

/*
 * Shown until the answer starts. Each tool the model uses becomes a step:
 * finished steps get a check, and the latest one spins (the tool is running, or the
 * model is reading its results). Before any tool runs: "Thinking…". Once the answer
 * starts streaming, the steps make way for it.
 */
function Thinking({ steps }: { steps: string[] }) {
  if (steps.length === 0) {
    return (
      <div className="flex items-center gap-3 pt-1.5 text-sm text-muted">
        <span className="chat-dots flex gap-1" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        Thinking…
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2 pt-1.5" aria-label="What the assistant is doing">
      {steps.map((step, i) => {
        const current = i === steps.length - 1;
        return (
          <li
            key={i}
            className={`chat-enter flex items-center gap-2.5 text-sm ${current ? "text-ink" : "text-muted"}`}
          >
            {current ? (
              <span
                aria-hidden="true"
                className="size-4 shrink-0 animate-spin rounded-full motion-reduce:animate-none border-2 border-pine/25 border-t-pine"
              />
            ) : (
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pine/12 text-pine">
                <CheckIcon className="size-3" />
              </span>
            )}
            <span className="truncate">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    // Copy without the [1] markers, which mean nothing outside this page.
    await navigator.clipboard.writeText(text.replace(/\s?\[\d+\]/g, ""));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3 flex opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <button
        type="button"
        onClick={() => void copy()}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-sand hover:text-ink"
      >
        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-label="Loading messages">
      <div className="ml-auto h-10 w-1/3 animate-pulse rounded-2xl bg-sand" />
      <div className="flex gap-4">
        <div className="size-8 animate-pulse rounded-lg bg-sand" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <div className="h-4 w-11/12 animate-pulse rounded bg-sand" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-sand" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-sand" />
        </div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "Summarize the main points of these documents",
  "What topics do these documents cover?",
  "List the key facts and figures mentioned",
  "What should a new team member read first?",
];

function EmptyState({
  hasDocuments,
  onPick,
}: {
  hasDocuments: boolean;
  onPick: (question: string) => void;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center sm:py-16">
      <span className="flex size-12 items-center justify-center rounded-xl bg-pine text-paper">
        <AssistantMark className="size-6" />
      </span>
      <h2 className="mt-5 font-display text-[clamp(26px,3vw,36px)] leading-[1.1] font-extrabold tracking-[-0.03em]">
        Ask your <span className="marker-sweep">documents</span>
      </h2>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink/70">
        {hasDocuments
          ? "Answers are written from passages in this workspace, with numbered sources you can open and check."
          : "This workspace has no documents yet. Upload some first, then come back and ask about them."}
      </p>

      {hasDocuments ? (
        <ul className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((question) => (
            <li key={question}>
              <button
                type="button"
                onClick={() => onPick(question)}
                className="h-full w-full rounded-xl border border-line bg-paper/50 px-4 py-3 text-left text-[14px] text-ink/80 transition-colors hover:border-pine/50 hover:bg-surface hover:text-ink"
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Link
          to=".."
          relative="path"
          className="mt-6 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-paper hover:bg-pine-dark"
        >
          Go to Documents
        </Link>
      )}
    </div>
  );
}
