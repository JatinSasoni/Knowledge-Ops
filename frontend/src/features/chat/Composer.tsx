import { useLayoutEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUpIcon, StopIcon } from "../../components/icons";

const MAX_HEIGHT = 200; // px; beyond this the box scrolls

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  isAnswering,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isAnswering: boolean;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);

  // Grow with the text: reset the height, then set it to what the content needs.
  useLayoutEffect(() => {
    const box = textarea.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  // Enter sends, Shift+Enter makes a new line (and Enter while typing with an IME is ignored).
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSubmit();
    }
  }

  const canSend = value.trim().length > 0;

  return (
    <form onSubmit={submit}>
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 pl-4 shadow-[0_8px_30px_-12px_rgba(18,22,18,0.25)] transition-colors focus-within:border-pine/60">
        <label htmlFor="question" className="sr-only">
          Your question
        </label>
        <textarea
          id="question"
          ref={textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          placeholder="Ask about this workspace's documents…"
          className="flex-1 resize-none bg-transparent py-2 text-[15.5px] leading-6 outline-none placeholder:text-muted/70"
        />
        {isAnswering ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop the answer"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink text-paper transition-colors hover:bg-ink/85"
          >
            <StopIcon />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send question"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pine text-paper transition-colors hover:bg-pine-dark disabled:bg-line disabled:text-muted"
          >
            <ArrowUpIcon className="size-[18px]" />
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-[12px] text-muted">
        Answers come only from this workspace's documents.{" "}
        <span className="hidden sm:inline">
          <kbd className="font-sans font-semibold">Enter</kbd> to send,{" "}
          <kbd className="font-sans font-semibold">Shift + Enter</kbd> for a new line.
        </span>
      </p>
    </form>
  );
}
