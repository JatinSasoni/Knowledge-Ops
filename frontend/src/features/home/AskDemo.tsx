import { useEffect, useMemo, useState } from "react";
import { demoQuestions, type DemoQuestion } from "./data";
import { useReducedMotion } from "./useReducedMotion";

const WORD_MS = 32;

function splitWords(question: DemoQuestion) {
  return question.answer.map((part) => part.text.split(/(?<=\s)/));
}

export function AskDemo() {
  const [questionId, setQuestionId] = useState(demoQuestions[0]!.id);
  const [shown, setShown] = useState(0);
  const [hoveredCite, setHoveredCite] = useState<number | null>(null);
  const [ticketFiled, setTicketFiled] = useState(false);
  const reduced = useReducedMotion();

  const question = demoQuestions.find((q) => q.id === questionId) ?? demoQuestions[0]!;
  const words = useMemo(() => splitWords(question), [question]);
  const total = words.reduce((sum, part) => sum + part.length, 0);
  const visible = reduced ? total : shown;
  const done = visible >= total;

  // Stream the answer word by word, the way the real chat endpoint sends tokens over SSE.
  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      setShown((n) => {
        if (n >= total) window.clearInterval(timer);
        return Math.min(n + 1, total);
      });
    }, WORD_MS);
    return () => window.clearInterval(timer);
  }, [questionId, total, reduced]);

  const ask = (id: string) => {
    if (id === questionId) return;
    setQuestionId(id);
    setShown(0);
    setHoveredCite(null);
    setTicketFiled(false);
  };

  const activeCite = hoveredCite ?? (done ? 1 : null);
  const activeSource = question.sources.find((s) => s.n === activeCite);

  // Words of each sentence revealed so far.
  const counts = words.map((part, i) => {
    const before = words.slice(0, i).reduce((sum, w) => sum + w.length, 0);
    return Math.max(0, Math.min(visible - before, part.length));
  });

  return (
    <div
      data-ui
      className="flex w-full flex-col overflow-hidden rounded-lg border border-line bg-surface text-[14px] leading-[1.5] text-ink"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded bg-pine text-[12px] font-semibold text-paper">
            S
          </span>
          <span className="font-semibold">Support</span>
        </div>
        <span className="text-muted">14 documents, 6 members</span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4" aria-live="polite">
        <p className="self-end rounded-lg bg-paper px-3 py-2 font-medium">{question.ask}</p>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-pine">Knowledge Ops</span>
          <p className="min-h-[4.5em]">
            {question.answer.map((part, i) => {
              const partWords = words[i] ?? [];
              const count = counts[i] ?? 0;
              const complete = count === partWords.length;
              return (
                <span key={`${question.id}-${i}`}>
                  {partWords.slice(0, count).join("")}
                  {complete && part.cite ? (
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredCite(part.cite!)}
                      onFocus={() => setHoveredCite(part.cite!)}
                      onClick={() => setHoveredCite(part.cite!)}
                      aria-label={`Show source ${part.cite}`}
                      className={`mx-0.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded px-1 align-[1px] text-[11px] font-semibold transition-colors ${
                        activeCite === part.cite
                          ? "bg-marker text-ink"
                          : "bg-paper text-muted hover:bg-marker/60"
                      }`}
                    >
                      {part.cite}
                    </button>
                  ) : null}
                </span>
              );
            })}
            {!done ? (
              <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-ink" />
            ) : null}
          </p>
        </div>

        {question.ticket && done ? (
          ticketFiled ? (
            <p className="rounded-md bg-paper px-3 py-2">
              Ticket filed for IT: <span className="font-semibold">{question.ticket.title}</span>,
              priority Low.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setTicketFiled(true)}
              className="self-start rounded-md bg-pine px-3 py-2 font-semibold text-paper transition-colors hover:bg-pine-dark active:translate-y-px"
            >
              {question.ticket.label}
            </button>
          )
        ) : null}

        <div className="min-h-[7.5rem] rounded-md bg-paper px-3 py-3">
          {activeSource ? (
            <>
              <p className="mb-1.5 text-[13px] text-muted">
                <span className="font-semibold text-ink">Source {activeSource.n}</span>{" "}
                {activeSource.doc}, {activeSource.where}
              </p>
              <p key={`${question.id}-${activeSource.n}`}>
                {activeSource.before}
                <mark className="marker-sweep bg-transparent text-ink">{activeSource.mark}</mark>
                {activeSource.after}
              </p>
            </>
          ) : (
            <p className="text-muted">
              {question.sources.length === 0
                ? done
                  ? "No passage in this workspace matched closely enough to answer."
                  : "Searching 14 documents…"
                : "Reading the passages it found…"}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-line bg-paper/60 px-4 py-3">
        <span className="text-[13px] text-muted">Ask about</span>
        <div className="flex flex-wrap gap-2">
          {demoQuestions.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => ask(q.id)}
              aria-pressed={q.id === questionId}
              className={`rounded-md border px-2.5 py-1.5 text-left text-[13px] transition-colors active:translate-y-px ${
                q.id === questionId
                  ? "border-pine bg-pine text-paper"
                  : "border-line bg-surface hover:border-pine"
              }`}
            >
              {q.ask}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
