import { useId, useState, type ReactNode } from "react";
import { workspaces, type ChunkSize, type WorkspaceName } from "./data";

type FileFilter = "all" | "pdf" | "md";

const SENTENCES: Record<ChunkSize, number> = { 300: 1, 500: 2, 800: 3 };

export function RetrievalDemo() {
  const [workspace, setWorkspace] = useState<WorkspaceName>("Support");
  const [topK, setTopK] = useState(3);
  const [chunkSize, setChunkSize] = useState<ChunkSize>(500);
  const [minScore, setMinScore] = useState(0.7);
  const [showScores, setShowScores] = useState(true);
  const [files, setFiles] = useState<FileFilter>("all");

  const ranked = workspaces[workspace]
    .filter((p) => files === "all" || p.type === files)
    .map((p) => ({ ...p, value: p.score[chunkSize] }))
    .sort((a, b) => b.value - a.value);

  const used = ranked.filter((p) => p.value >= minScore).slice(0, topK);
  const usedIds = new Set(used.map((p) => p.id));

  return (
    <div
      data-ui
      className="grid overflow-hidden rounded-lg bg-sand text-[14px] leading-[1.5] text-ink md:grid-cols-[62fr_38fr]"
    >
      <div className="flex min-h-[560px] flex-col gap-3 bg-surface p-5">
        <div className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="shrink-0 text-muted"
          >
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M11 11l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span>How long do refunds take?</span>
          <span className="ml-auto text-[13px] text-muted">in {workspace}</span>
        </div>

        <ol className="flex flex-col gap-2" aria-label="Passages, closest match first">
          {ranked.map((p) => {
            const isUsed = usedIds.has(p.id);
            return (
              <li
                key={p.id}
                className={`rounded-md px-3 py-2.5 transition-[opacity,background-color] duration-300 ${
                  isUsed ? "bg-paper" : "bg-transparent opacity-45"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
                  <span>
                    <span className="font-semibold">{p.doc}</span>
                    <span className="text-muted">, passage {p.index}</span>
                  </span>
                  {showScores ? (
                    <span className="flex items-center gap-2 tabular-nums text-muted">
                      <span className="relative h-1.5 w-14 overflow-hidden rounded bg-line">
                        <span
                          className="absolute inset-y-0 left-0 rounded bg-pine transition-[width] duration-300"
                          style={{ width: `${Math.round(p.value * 100)}%` }}
                        />
                      </span>
                      {p.value.toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <p className={isUsed ? "" : "text-muted"}>
                  {p.sentences.slice(0, SENTENCES[chunkSize]).join(" ")}
                </p>
              </li>
            );
          })}
        </ol>

        <p className="mt-auto rounded-md bg-pine px-3 py-2.5 text-paper">
          {used.length > 0
            ? `The answer would be written from ${used.length} passage${used.length > 1 ? "s" : ""}.`
            : `Nothing scores ${minScore.toFixed(2)} or higher, so it would say the answer isn't in ${workspace}'s documents.`}
        </p>
      </div>

      <div className="flex flex-col gap-1 p-5">
        <Row label="Workspace">
          <Segmented
            value={workspace}
            options={["Support", "Finance"] as const}
            onChange={setWorkspace}
            label="Workspace"
          />
        </Row>
        <Row label="Passages to use">
          <Stepper value={topK} min={1} max={5} onChange={setTopK} label="Passages to use" />
        </Row>
        <Row label="Passage length">
          <Segmented
            value={chunkSize}
            options={[300, 500, 800] as const}
            onChange={setChunkSize}
            label="Passage length in tokens"
          />
        </Row>
        <Row label={`Minimum match ${minScore.toFixed(2)}`}>
          <input
            type="range"
            min={0.4}
            max={0.9}
            step={0.05}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            aria-label="Minimum match"
            className="w-28 accent-[var(--color-pine)]"
          />
        </Row>
        <Row label="File types">
          <Segmented
            value={files}
            options={["all", "pdf", "md"] as const}
            names={{ all: "All", pdf: "PDF", md: "Markdown" }}
            onChange={setFiles}
            label="File types"
          />
        </Row>
        <Row label="Show match scores">
          <Toggle checked={showScores} onChange={setShowScores} label="Show match scores" />
        </Row>
        <p className="mt-auto pt-6 text-[13px] text-muted">
          Passage length is measured in tokens, roughly three quarters of a word each.
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-1">
      <span className="text-[14px]">{label}</span>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({
  value,
  options,
  names,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  names?: Partial<Record<T, string>>;
  onChange: (v: T) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-md bg-surface p-0.5">
      {options.map((opt) => (
        <button
          key={`${id}-${opt}`}
          type="button"
          role="radio"
          aria-checked={opt === value}
          onClick={() => onChange(opt)}
          className={`rounded px-2.5 py-1 text-[13px] transition-colors ${
            opt === value ? "bg-pine font-semibold text-paper" : "text-muted hover:text-ink"
          }`}
        >
          {names?.[opt] ?? String(opt)}
        </button>
      ))}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const btn =
    "grid size-7 place-items-center rounded bg-surface text-[15px] font-semibold transition-colors hover:bg-marker disabled:opacity-40 disabled:hover:bg-surface";
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Fewer"
      >
        −
      </button>
      <span className="w-4 text-center tabular-nums font-semibold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="More"
      >
        +
      </button>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-pine" : "bg-line"}`}
    >
      <span
        className={`absolute left-0 top-0.5 size-5 rounded-full bg-surface transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}
