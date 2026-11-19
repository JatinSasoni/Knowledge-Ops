import Markdown, { type Components } from "react-markdown";
import type { Citation } from "../../types";
import { DocumentIcon } from "../../components/icons";

/*
 * The model writes Markdown and cites sources as [1], [2]...
 * Before rendering, each [n] that matches a real citation becomes a link to "#cite-n",
 * and our `a` component draws those links as clickable chips.
 * react-markdown builds React elements (no innerHTML), so text from the model or the
 * documents can't inject HTML or scripts.
 */
export function Answer({
  content,
  citations,
  onCite,
  streaming = false,
}: {
  content: string;
  citations: Citation[];
  onCite: (citation: Citation) => void;
  streaming?: boolean;
}) {
  const known = new Set(citations.map((citation) => citation.n));
  const withChips = content.replace(/\[(\d+)\](?!\()/g, (match, n) =>
    known.has(Number(n)) ? `[${n}](#cite-${n})` : match,
  );

  const components: Components = {
    a: ({ href = "", children }) => {
      if (href.startsWith("#cite-")) {
        const citation = citations.find((c) => c.n === Number(href.slice(6)));
        if (!citation) return <>{children}</>;
        return (
          <button
            type="button"
            onClick={() => onCite(citation)}
            title={`${citation.documentTitle}, passage ${citation.index + 1}`}
            className="mx-px inline-flex h-[18px] min-w-[18px] -translate-y-px items-center justify-center rounded-[5px] bg-pine/12 px-1 align-middle text-[11px] font-bold text-pine transition-colors hover:bg-pine hover:text-paper"
          >
            {citation.n}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noreferrer" className="text-pine underline">
          {children}
        </a>
      );
    },
    p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
    ul: ({ children }) => (
      <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-pine/60">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-3 list-decimal space-y-1.5 pl-5 marker:text-muted">{children}</ol>
    ),
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    h1: ({ children }) => <h3 className="mt-6 mb-2 text-[17px] font-bold">{children}</h3>,
    h2: ({ children }) => <h3 className="mt-6 mb-2 text-[17px] font-bold">{children}</h3>,
    h3: ({ children }) => <h4 className="mt-5 mb-2 font-bold">{children}</h4>,
    code: ({ children }) => (
      <code className="rounded bg-sand/70 px-1 py-0.5 font-mono text-[0.88em]">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="my-3 overflow-x-auto rounded-lg bg-ink p-4 text-[13px] text-paper [&_code]:bg-transparent [&_code]:p-0">
        {children}
      </pre>
    ),
  };

  return (
    <div
      className={`text-[15.5px] leading-[1.75] text-ink/90 ${streaming ? "chat-streaming" : ""}`}
    >
      <Markdown components={components}>{withChips}</Markdown>
    </div>
  );
}

// The citation numbers the answer actually uses, e.g. "… [1][3]." → {1, 3}
function citedNumbers(content: string): Set<number> {
  return new Set([...content.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1])));
}

/*
 * Sources under an answer.
 * Retrieval always finds *something*, even for "Hi", so we only list passages the
 * answer really cites, and group them by document: one row per file, with a
 * button per passage.
 */
export function Sources({
  content,
  citations,
  onCite,
}: {
  content: string;
  citations: Citation[];
  onCite: (citation: Citation) => void;
}) {
  const cited = citedNumbers(content);
  const used = citations.filter((citation) => cited.has(citation.n));
  if (used.length === 0) return null;

  // documentId → { title, passages }
  const byDocument = new Map<string, { title: string; passages: Citation[] }>();
  for (const citation of used) {
    const group = byDocument.get(citation.documentId);
    if (group) group.passages.push(citation);
    else
      byDocument.set(citation.documentId, { title: citation.documentTitle, passages: [citation] });
  }

  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Sources</p>
      <ul className="flex flex-wrap gap-2">
        {[...byDocument].map(([documentId, { title, passages }]) => (
          <li
            key={documentId}
            className="flex max-w-full items-center gap-2 rounded-lg border border-line bg-paper/60 py-1.5 pr-1.5 pl-2.5"
          >
            <DocumentIcon className="size-4 shrink-0 text-pine" />
            <span className="truncate text-[13px] font-medium">{title}</span>
            <span className="flex shrink-0 gap-1">
              {passages.map((citation) => (
                <button
                  key={citation.n}
                  type="button"
                  onClick={() => onCite(citation)}
                  title={`Open passage ${citation.index + 1}`}
                  className="flex h-6 min-w-6 items-center justify-center rounded-md bg-surface px-1.5 text-[11px] font-bold text-pine ring-1 ring-line transition-colors hover:bg-pine hover:text-paper hover:ring-pine"
                >
                  {citation.n}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
