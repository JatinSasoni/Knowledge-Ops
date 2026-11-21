import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUpIcon, CloseIcon, DocumentIcon, StopIcon } from "../components/icons";
import { Answer, Sources } from "../features/chat/Answer";
import { createTypewriter } from "../features/chat/typewriter";
import type { Citation } from "../types";
import { askWidget, WidgetError, type WidgetMessage } from "./api";

type Message = WidgetMessage & { citations?: Citation[] };
export type WidgetSettings = { key: string; workspace: string };

// The Citely mark (golden document on green), the same image as the app's favicon.
// The iframe is served by the Citely server, so "/apple-touch-icon.png" is Citely's file.
// Decorative (alt=""): the header text already says who is answering.
function BrandIcon({ className }: { className: string }) {
  return (
    <img
      src="/apple-touch-icon.png"
      alt=""
      width={180}
      height={180}
      className={`shrink-0 object-cover ${className}`}
    />
  );
}

// Ask the page around the iframe (widget.js) to close the chat. It only carries a
// type, no data, so sending it to any origin ("*") leaks nothing.
const closeWidget = () => window.parent.postMessage({ type: "citely:close" }, "*");

/*
 * The chat inside the iframe on the customer's website.
 * - Visitors aren't logged in and nothing is saved per visitor: the conversation lives
 *   only in this component's state (gone when the page reloads).
 * - Each question sends the last few messages, so follow-ups like "and the price?" work.
 */
export function WidgetApp({ settings }: { settings: WidgetSettings }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [answering, setAnswering] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSource, setOpenSource] = useState<Citation | null>(null);
  const stopRef = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the newest text in view.
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, status]);

  // Escape: close the source panel first, otherwise close the whole chat.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (openSource) setOpenSource(null);
      else closeWidget();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSource]);

  // Change the last message (the answer being written).
  const updateAnswer = (change: Partial<Message>) =>
    setMessages((list) => list.map((m, i) => (i === list.length - 1 ? { ...m, ...change } : m)));

  async function ask(question: string) {
    const history: WidgetMessage[] = messages.map(({ role, content }) => ({ role, content }));
    setMessages((list) => [
      ...list,
      { role: "USER", content: question },
      { role: "ASSISTANT", content: "", citations: [] },
    ]);
    setDraft("");
    setError(null);
    setAnswering(true);

    const stop = new AbortController();
    stopRef.current = stop;
    // Same reading pace as the app: tokens go into a buffer, the screen types them out.
    const typewriter = createTypewriter((content) => updateAnswer({ content }));
    stop.signal.addEventListener("abort", typewriter.cancel);

    try {
      await askWidget(
        settings.key,
        question,
        history,
        {
          onStatus: setStatus,
          onCitations: (citations) => updateAnswer({ citations }),
          onToken: (text) => {
            setStatus(null);
            typewriter.add(text);
          },
        },
        stop.signal,
      );
      await typewriter.finish();
    } catch (err) {
      typewriter.cancel();
      if (!stop.signal.aborted) {
        setError(
          err instanceof WidgetError ? err.message : "Something went wrong. Please try again.",
        );
        // Drop the empty answer bubble if nothing arrived.
        setMessages((list) => (list.at(-1)?.content ? list : list.slice(0, -1)));
      }
    } finally {
      setStatus(null);
      setAnswering(false);
      stopRef.current = null;
    }
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const question = draft.trim();
    if (question && !answering) void ask(question);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  const last = messages.at(-1);
  const waiting = answering && last?.role === "ASSISTANT" && !last.content;

  return (
    <div className="relative flex h-full flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center gap-3 bg-pine px-4 py-3 text-paper">
        <BrandIcon className="size-9 rounded-xl ring-1 ring-paper/20" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{settings.workspace}</p>
          <p className="text-[12px] text-paper/75">Answers with sources</p>
        </div>
        <button
          type="button"
          onClick={closeWidget}
          aria-label="Close chat"
          className="rounded-md p-1.5 text-paper/80 hover:bg-paper/10 hover:text-paper"
        >
          <CloseIcon />
        </button>
      </header>

      {/* Messages */}
      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="mt-6 flex flex-col items-center text-center">
            <BrandIcon className="mb-3 size-12 rounded-2xl shadow-sm" />
            <p className="font-semibold">Hi! How can we help?</p>
            <p className="mt-1 text-[14px] text-muted">
              Ask anything about {settings.workspace}. Every answer shows where it came from.
            </p>
          </div>
        )}

        <ol className="flex flex-col gap-4">
          {messages.map((message, i) =>
            message.role === "USER" ? (
              <li key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-[14px] whitespace-pre-wrap text-paper">
                  {message.content}
                </p>
              </li>
            ) : message.content ? (
              <li key={i} className="flex gap-2.5 text-[14px]">
                <BrandIcon className="mt-0.5 size-7 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Answer
                    content={message.content}
                    citations={message.citations ?? []}
                    onCite={setOpenSource}
                    streaming={answering && i === messages.length - 1}
                  />
                  <Sources
                    content={message.content}
                    citations={message.citations ?? []}
                    onCite={setOpenSource}
                  />
                </div>
              </li>
            ) : null,
          )}
        </ol>

        {waiting && (
          <div className="mt-3 flex items-center gap-2.5 text-[13px] text-muted">
            <BrandIcon className="size-7 rounded-lg" />
            <span className="chat-dots flex gap-1" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            {status ?? "Thinking…"}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger"
          >
            {error}
          </p>
        )}
      </div>

      {/* Question box */}
      <form onSubmit={submit} className="border-t border-line p-3">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-paper/40 p-1.5 pl-3 focus-within:border-pine/60">
          <label htmlFor="widget-question" className="sr-only">
            Your question
          </label>
          <textarea
            id="widget-question"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={1000}
            placeholder="Ask a question…"
            className="max-h-28 flex-1 resize-none bg-transparent py-1.5 text-[14px] outline-none placeholder:text-muted/70"
          />
          {answering ? (
            <button
              type="button"
              onClick={() => stopRef.current?.abort()}
              aria-label="Stop the answer"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink text-paper"
            >
              <StopIcon className="size-3" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send question"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pine text-paper disabled:bg-line disabled:text-muted"
            >
              <ArrowUpIcon className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          Powered by <span className="font-semibold text-ink/80">Citely</span>
        </p>
      </form>

      {/* Source panel: covers the chat inside the iframe */}
      {openSource && (
        <div className="absolute inset-0 flex flex-col bg-surface">
          <div className="flex items-start gap-3 border-b border-line px-4 py-3">
            <DocumentIcon className="mt-0.5 size-4 shrink-0 text-pine" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{openSource.documentTitle}</p>
              <p className="text-[12px] text-muted">
                Source {openSource.n} · passage {openSource.index + 1}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenSource(null)}
              aria-label="Back to the chat"
              className="rounded-md p-1 text-muted hover:bg-sand hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>
          <p className="flex-1 overflow-y-auto px-4 py-4 text-[14px] leading-[1.8] whitespace-pre-wrap text-ink/85">
            <mark className="bg-marker/45 text-inherit">{openSource.content}</mark>
          </p>
        </div>
      )}
    </div>
  );
}
