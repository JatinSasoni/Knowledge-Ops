import { useLayoutEffect, useRef, useState } from "react";
import { demoQuestions, type DemoQuestion } from "./data";
import { wrap } from "./layout";

/*
 * "Headline you can type": the section's headline is a real input, prefilled with a question.
 * Below it, the answer appears at true size, with its numbered sources, and changes as the
 * visitor types. It answers from the sample Support handbook only (data.ts): a question that
 * matches nothing there gets Citely's real behaviour, "not in these documents", not a guess.
 */

// Words too common to tell questions apart.
const STOP = new Set(
  "the a an and or of to in on for with is are was be do does did can could i we you our your my it its what how when where who why which there their this that from at by not get".split(
    " ",
  ),
);

function words(text: string) {
  return (text.toLowerCase().match(/[a-z0-9-]+/g) ?? []).filter(
    (w) => w.length > 2 && !STOP.has(w),
  );
}

// The sample question that shares the most meaningful words (matching word starts, so
// "refund" finds "refunds"). Null when nothing overlaps.
function bestMatch(text: string): DemoQuestion | null {
  const asked = words(text);
  let best: DemoQuestion | null = null;
  let bestScore = 0;
  for (const question of demoQuestions) {
    const known = words(
      [
        question.ask,
        ...question.answer.map((p) => p.text),
        ...question.sources.map((s) => s.mark),
      ].join(" "),
    );
    const score = asked.filter((w) => known.some((k) => k.startsWith(w.slice(0, 5)))).length;
    if (score > bestScore) {
      best = question;
      bestScore = score;
    }
  }
  return best;
}

export function AskAnything() {
  const [text, setText] = useState(demoQuestions[0]!.ask);
  const box = useRef<HTMLTextAreaElement>(null);

  // Grow the text area to fit its text: reset the height, then use what the content needs.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);
  const match = text.trim() ? bestMatch(text) : null;
  const examples = demoQuestions.filter((q) => q.ask !== text).slice(0, 3);

  return (
    <section id="ask" className={`${wrap} scroll-mt-8 py-28 lg:py-40`}>
      <h2 id="ask-heading" className="sr-only">
        Ask it a question
      </h2>
      <div data-ui className="relative">
        {/* A text area, not a one-line input, so long questions wrap instead of being cut off.
            It grows with the text (useAutoHeight); Enter doesn't add a new line. */}
        <textarea
          ref={box}
          rows={1}
          aria-labelledby="ask-heading"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/\n/g, " "))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          maxLength={120}
          spellCheck={false}
          className="block w-full resize-none overflow-hidden bg-transparent font-display text-[10vw] leading-[1.05] font-extrabold tracking-[-0.04em] text-ink caret-pine outline-none placeholder:text-ink/25 md:text-[clamp(40px,5.6vw,88px)]"
          placeholder="Ask anything…"
        />
      </div>

      <div className="mt-7 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-7" aria-live="polite">
          {text.trim() ? <AnswerCard key={match?.id ?? "none"} question={match} /> : null}
        </div>

        <div className="flex flex-col gap-3 lg:col-span-4 lg:col-start-9 lg:pt-2">
          <p className="text-[17px] text-ink/75">
            Type your own question, or try one of these from a sample support handbook:
          </p>
          <ul className="flex flex-col gap-1">
            {examples.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setText(q.ask)}
                  className="py-1.5 text-left text-[18px] font-semibold text-pine underline-offset-4 transition-colors hover:underline focus-visible:underline"
                >
                  {q.ask}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- The answer, at true interface size ---------- */

function AnswerCard({ question }: { question: DemoQuestion | null }) {
  const firstCite = question?.answer.find((p) => p.cite)?.cite ?? null;
  const [active, setActive] = useState<number | null>(firstCite);
  const source = question?.sources.find((s) => s.n === active);

  return (
    <div
      data-ui
      className="chat-enter max-w-[560px] overflow-hidden rounded-lg bg-surface text-[15px] leading-[1.6] text-ink ring-1 ring-line"
    >
      <div className="flex items-center gap-2 bg-paper/60 px-4 py-2.5 text-[13px] text-muted">
        <span className="grid size-5 place-items-center rounded bg-pine text-[11px] font-bold text-paper">
          S
        </span>
        <span className="font-semibold text-ink">Support</span> · 14 documents
      </div>

      <div className="px-4 py-4">
        <p className="mb-1 text-[13px] font-semibold text-pine">Citely</p>
        {question ? (
          <p>
            {question.answer.map((part, i) => (
              <span key={i}>
                {part.text}
                {part.cite ? (
                  <button
                    type="button"
                    onClick={() => setActive(part.cite!)}
                    aria-label={`Show source ${part.cite}`}
                    aria-pressed={active === part.cite}
                    className={`mx-0.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded px-1 align-[1px] text-[11px] font-bold transition-colors ${
                      active === part.cite
                        ? "bg-marker text-ink"
                        : "bg-paper text-muted hover:bg-marker/60"
                    }`}
                  >
                    {part.cite}
                  </button>
                ) : null}
              </span>
            ))}
          </p>
        ) : (
          <p>
            I couldn't find that in the Support workspace's documents, so I won't guess. Try asking
            about refunds, billing or annual plans.
          </p>
        )}
      </div>

      {source ? (
        <div className="mx-4 mb-4 rounded-md bg-paper px-3 py-3">
          <p className="mb-1.5 text-[13px] text-muted">
            <span className="font-semibold text-ink">Source {source.n}</span> {source.doc},{" "}
            {source.where}
          </p>
          <p key={source.n}>
            {source.before}
            <mark className="marker-sweep bg-transparent text-ink">{source.mark}</mark>
            {source.after}
          </p>
        </div>
      ) : null}
    </div>
  );
}
