import { useEffect, useRef } from "react";
import type { Citation } from "../../types";

// Slides in from the right with the cited passage, highlighted like a marker pen.
export function SourceDrawer({
  citation,
  onClose,
}: {
  citation: Citation | null;
  onClose: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);

  // Escape closes it; focus moves into it so keyboard users land on the source.
  useEffect(() => {
    if (!citation) return;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [citation, onClose]);

  if (!citation) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl"
        style={{ animation: "fade 0.2s ease-out" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.12em] text-muted uppercase">
              Source {citation.n}
            </p>
            <h2 id="source-title" className="mt-1 font-display text-xl font-bold break-words">
              {citation.documentTitle}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Passage {citation.index + 1} · {Math.round(citation.similarity * 100)}% match
            </p>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close source"
            className="rounded-md px-2 py-1 text-xl leading-none text-muted hover:bg-sand hover:text-ink"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* key: replay the highlight animation when another source is opened */}
          <p key={citation.n} className="text-[15px] leading-[1.9] whitespace-pre-wrap text-ink/90">
            <span className="marker-soft">{citation.content}</span>
          </p>
        </div>
      </aside>
    </>
  );
}
