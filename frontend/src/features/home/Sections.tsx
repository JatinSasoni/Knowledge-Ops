import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { comparison, faqs } from "./data";
import { delay, h2Big, PENDING_WORKSPACE_KEY, sectionY, wrap } from "./layout";
import { useReducedMotion } from "./useReducedMotion";

/* ---------- How it works: call and response ---------- */

function Step({
  sentence,
  call,
  response,
  wide = false,
}: {
  sentence: string;
  call?: ReactNode;
  response: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p
        data-reveal
        className="font-display text-[28px] font-semibold leading-[1.2] tracking-[-0.01em]"
      >
        {sentence}
      </p>
      {call ? (
        <div data-reveal style={delay(80)}>
          {call}
        </div>
      ) : null}
      <div data-reveal style={delay(160)} className={wide ? "" : "lg:ml-14"}>
        {response}
      </div>
    </div>
  );
}

const statusStyle = {
  Uploaded: "bg-sand text-ink",
  Ready: "bg-pine/12 text-pine",
  Processing: "bg-marker/50 text-ink",
  Failed: "bg-danger/10 text-danger",
} as const;

const docs = [
  { name: "Refund policy.pdf", status: "Processing", note: "Reading page 7 of 12" },
  { name: "Escalation guide.md", status: "Ready", note: "9 passages" },
  { name: "Annual plans FAQ.md", status: "Ready", note: "6 passages" },
  { name: "Scanned invoice.pdf", status: "Failed", note: "No text layer. Add a text version." },
] as const;

const callPanel = "flex items-center gap-3 rounded-md bg-sand p-5 text-[16px]";

export function HowItWorks() {
  return (
    <section id="how" className={`${wrap} ${sectionY} scroll-mt-8`}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-4">
          <div className="flex flex-col gap-5 lg:sticky lg:top-12">
            <h2 data-reveal className={h2Big}>
              How it works
            </h2>
            <p data-reveal style={delay(80)} className="max-w-[30ch] text-[20px] leading-[1.5]">
              Three steps from a file on your laptop to an answer you can check.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-20 lg:col-span-8">
          <Step
            sentence="First, add a document to a workspace."
            call={
              <div className={callPanel}>
                <span className="grid h-10 w-8 place-items-center rounded-sm bg-surface text-[11px] font-semibold text-danger">
                  PDF
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">Refund policy.pdf</span>
                  <span className="text-muted">12 pages, 2.4 MB</span>
                </span>
                <span className="ml-auto rounded-md bg-pine px-3 py-1.5 font-semibold text-paper">
                  Upload
                </span>
              </div>
            }
            response={
              <div
                data-ui
                className="overflow-hidden rounded-lg border border-line bg-surface text-[14px]"
              >
                {docs.map((d, i) => (
                  <div
                    key={d.name}
                    className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <span className="font-medium">{d.name}</span>
                    <span className="ml-auto text-muted">{d.note}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[12px] font-semibold ${statusStyle[d.status]}`}
                    >
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            }
          />

          <Step
            sentence="Then ask it something, the way you'd ask a teammate."
            call={
              <div className={callPanel}>
                <span>Can a customer get a refund after 45 days?</span>
                <span className="ml-auto rounded-md bg-pine px-3 py-1.5 font-semibold text-paper">
                  Ask
                </span>
              </div>
            }
            response={
              <div
                data-ui
                className="rounded-lg border border-line bg-surface px-4 py-4 text-[14px] leading-[1.55]"
              >
                <span className="mb-1 block text-[13px] font-semibold text-pine">
                  Knowledge Ops
                </span>
                Not as a refund. After 30 days, the unused months of an annual plan become store
                credit instead.
                <span className="mx-0.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded bg-marker px-1 align-[1px] text-[11px] font-semibold">
                  1
                </span>
              </div>
            }
          />

          <Step
            sentence="Finally, open the passage the answer came from."
            wide
            response={
              <div
                data-ui
                className="overflow-hidden rounded-lg border border-line bg-surface text-[14px]"
              >
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <span className="font-semibold">Refund policy.pdf</span>
                  <span className="text-muted">Page 3 of 12</span>
                </div>
                <div className="grid gap-6 px-5 py-6 md:grid-cols-[1fr_190px]">
                  <div className="flex flex-col gap-3 leading-[1.65] text-ink/85">
                    <p className="font-semibold text-ink">3. Refunds</p>
                    <p>
                      Refund requests are handled by the support team and approved by a team lead.
                      Customers can request a full refund within 30 days of purchase.{" "}
                      <mark className="bg-marker px-0.5 text-ink">
                        After 30 days, the unused months of an annual plan are turned into store
                        credit instead.
                      </mark>{" "}
                      Store credit does not expire.
                    </p>
                    <p>
                      Money goes back to the original payment method and usually arrives within 5 to
                      10 business days, depending on the customer's bank.
                    </p>
                  </div>
                  <div className="self-start rounded-md bg-paper p-3 text-[13px] leading-[1.45]">
                    <span className="font-semibold">Source 1</span>
                    <span className="block text-muted">
                      Used in the answer to “Can a customer get a refund after 45 days?”
                    </span>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- Pipeline: what happens to a file ---------- */

const stages = [
  {
    name: "Uploaded",
    status: "Uploaded",
    progress: 8,
    log: "2.4 MB received",
    detail: "The file is stored and the API replies 202 Accepted straight away. Nobody waits.",
  },
  {
    name: "Queued",
    status: "Processing",
    progress: 20,
    log: "Waiting in the ingest queue",
    detail:
      "A job waits in a Redis queue. If it fails, it retries up to 3 times, waiting longer each time.",
  },
  {
    name: "Read",
    status: "Processing",
    progress: 42,
    log: "Reading page 7 of 12",
    detail: "A background worker pulls the text out of the PDF, Markdown or text file.",
  },
  {
    name: "Split",
    status: "Processing",
    progress: 62,
    log: "48 passages",
    detail:
      "The text is cut into passages of about 500 tokens that overlap by 50, so no sentence loses its context.",
  },
  {
    name: "Embedded",
    status: "Processing",
    progress: 84,
    log: "Embedding passage 31 of 48",
    detail: "Each passage becomes a vector of 1,536 numbers, stored in Postgres next to its text.",
  },
  {
    name: "Ready",
    status: "Ready",
    progress: 100,
    log: "48 passages ready",
    detail: "Searchable straight away, and only from inside this workspace.",
  },
] as const;

export function Pipeline() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [held, setHeld] = useState(false);
  const current = reduced ? stages.length - 1 : step;
  const stage = stages[current]!;

  useEffect(() => {
    if (reduced || held) return;
    const wait = step === stages.length - 1 ? 3600 : 1800;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") setStep((s) => (s + 1) % stages.length);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [step, reduced, held]);

  return (
    <section id="pipeline" className={`bg-ink text-paper ${sectionY}`}>
      <div className={`${wrap} grid gap-12 lg:grid-cols-12 lg:gap-x-10`}>
        <div className="flex flex-col gap-8 lg:col-span-5">
          <h2 data-reveal className={h2Big}>
            What happens to a file
          </h2>
          <p
            data-reveal
            style={delay(80)}
            className="max-w-[34ch] text-[20px] leading-[1.5] text-paper/85"
          >
            Uploading returns at once. The slow reading and filing happens in a background worker,
            so a 50-page PDF never slows anyone's search.
          </p>

          <div
            data-ui
            data-reveal
            style={delay(160)}
            className="rounded-lg bg-surface p-5 text-[14px] text-ink"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-8 place-items-center rounded-sm bg-paper text-[11px] font-semibold text-danger">
                PDF
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">Refund policy.pdf</span>
                <span className="text-muted">{stage.log}</span>
              </span>
              <span
                className={`ml-auto rounded px-2 py-0.5 text-[12px] font-semibold ${statusStyle[stage.status]}`}
              >
                {stage.status}
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded bg-paper">
              <div
                className="h-full rounded bg-pine transition-[width] duration-700 ease-out"
                style={{ width: `${stage.progress}%` }}
              />
            </div>
          </div>
        </div>

        <ol
          className="flex flex-col gap-1 lg:col-span-7"
          aria-label="Stages a document goes through"
        >
          {stages.map((s, i) => {
            const active = i === current;
            const done = i < current;
            return (
              <li key={s.name}>
                <button
                  type="button"
                  onClick={() => {
                    setStep(i);
                    setHeld(true);
                  }}
                  onBlur={() => setHeld(false)}
                  aria-current={active ? "step" : undefined}
                  className={`grid w-full gap-x-6 gap-y-1 rounded-md px-5 py-4 text-left transition-colors duration-500 md:grid-cols-[200px_1fr] md:items-baseline ${
                    active
                      ? "bg-pine text-paper"
                      : done
                        ? "text-paper/80 hover:bg-paper/5"
                        : "text-paper/40 hover:bg-paper/5"
                  }`}
                >
                  <span className="font-display text-[32px] font-bold leading-[1.1] tracking-[-0.02em]">
                    {s.name}
                  </span>
                  <span className="text-[17px] leading-[1.5]">{s.detail}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Teams: one workspace per team ---------- */

const members = [
  { name: "Asha Rao", email: "asha@example.com", role: "Admin", you: true },
  { name: "Leo Martins", email: "leo@example.com", role: "Admin", you: false },
  { name: "Mina Okafor", email: "mina@example.com", role: "Member", you: false },
  { name: "Sam Lee", email: "sam@example.com", role: "Member", you: false },
] as const;

export function Teams() {
  return (
    <section className={`bg-pine text-paper ${sectionY}`}>
      <div className={`${wrap} grid items-center gap-12 lg:grid-cols-12 lg:gap-x-10`}>
        <div className="flex flex-col gap-8 lg:col-span-6">
          <h2 data-reveal className={h2Big}>
            One workspace per team
          </h2>
          <p
            data-reveal
            style={delay(80)}
            className="max-w-[30ch] text-[20px] leading-[1.4] md:text-[26px]"
          >
            Support's documents answer Support's questions. Finance never sees them, and neither
            does anyone you haven't added.
          </p>
          <ul
            data-reveal
            style={delay(160)}
            className="flex flex-col gap-3 text-[18px] leading-[1.5] text-paper/90"
          >
            <li>
              <strong className="text-paper">Admins</strong> add and remove people, and rename or
              delete the workspace.
            </li>
            <li>
              <strong className="text-paper">Members</strong> read, upload and ask.
            </li>
            <li>
              <strong className="text-paper">Every workspace</strong> keeps at least one admin, so
              it's never left without an owner.
            </li>
          </ul>
        </div>

        <div data-reveal style={delay(120)} className="lg:col-span-6">
          <div data-ui className="overflow-hidden rounded-lg bg-surface text-[14px] text-ink">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <span className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded bg-pine text-[12px] font-semibold text-paper">
                  S
                </span>
                <span className="text-[16px] font-semibold">Support members</span>
              </span>
              <span className="text-muted">4 people</span>
            </div>
            <ul>
              {members.map((m) => (
                <li
                  key={m.email}
                  className="flex items-center gap-3 border-b border-line px-5 py-3 transition-colors hover:bg-paper/60"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sand text-[13px] font-semibold">
                    {m.name.charAt(0)}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">
                      {m.name}
                      {m.you ? <span className="text-muted"> (you)</span> : null}
                    </span>
                    <span className="truncate text-muted">{m.email}</span>
                  </span>
                  <span
                    className={`ml-auto rounded px-2 py-0.5 text-[12px] font-semibold ${
                      m.role === "Admin" ? "bg-pine text-paper" : "bg-sand text-ink"
                    }`}
                  >
                    {m.role}
                  </span>
                  <span className="hidden w-16 text-right text-muted sm:inline">
                    {m.you ? "" : "Remove"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2 bg-paper/60 px-5 py-4">
              <span className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-muted">
                teammate@example.com
              </span>
              <span className="rounded-md border border-line bg-surface px-3 py-2">Member</span>
              <span className="rounded-md bg-pine px-3 py-2 font-semibold text-paper">Add</span>
            </div>
            <p className="px-5 py-3 text-[13px] text-muted">
              Searching Finance for “refund” returns nothing from Support.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Comparison set as text ---------- */

export function Comparison() {
  const [featured, ...others] = comparison.columns;
  return (
    <section className={`${wrap} ${sectionY}`}>
      <h2 data-reveal className={`${h2Big} mb-12 max-w-[14ch]`}>
        Next to what you use now
      </h2>

      <div
        data-reveal
        style={delay(80)}
        className="hidden lg:block"
        role="table"
        aria-label="Knowledge Ops compared with a shared drive and team chat"
      >
        <div role="row" className="grid grid-cols-[5fr_repeat(3,minmax(0,2.33fr))] items-end">
          <span role="columnheader">
            <span className="sr-only">Capability</span>
          </span>
          <span
            role="columnheader"
            className="bg-pine px-5 pb-3 pt-9 text-[18px] font-bold text-paper"
          >
            {featured}
          </span>
          {others.map((c) => (
            <span role="columnheader" key={c} className="px-5 pb-3 text-[18px] font-bold">
              {c}
            </span>
          ))}
        </div>
        {comparison.rows.map(([name, ...cells], r) => (
          <div
            role="row"
            key={name}
            className={`grid min-h-[72px] grid-cols-[5fr_repeat(3,minmax(0,2.33fr))] items-center ${r % 2 === 0 ? "bg-sand" : ""}`}
          >
            <span role="rowheader" className="px-5 text-[24px] font-medium leading-[1.25]">
              {name}
            </span>
            {cells.map((cell, c) => (
              <span
                role="cell"
                key={c}
                className={`flex h-full items-center px-5 text-[18px] leading-[1.35] ${
                  c === 0
                    ? `font-semibold text-paper ${r % 2 === 0 ? "bg-pine-dark" : "bg-pine"}`
                    : ""
                }`}
              >
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:hidden">
        {comparison.rows.map(([name, ...cells], r) => (
          <div
            key={name}
            className={`flex flex-col gap-2 px-4 py-5 ${r % 2 === 0 ? "bg-sand" : ""}`}
          >
            <h3 className="text-[24px] font-bold leading-[1.25]">{name}</h3>
            {cells.map((cell, c) => (
              <p
                key={c}
                className={`text-[16px] ${c === 0 ? "-mx-4 bg-pine px-4 py-2 font-semibold text-paper" : ""}`}
              >
                <span className={c === 0 ? "text-paper/80" : "text-muted"}>
                  {comparison.columns[c]}:{" "}
                </span>
                {cell}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- FAQ: question index, one answer ---------- */

export function Questions() {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const faq = faqs[selected]!;

  return (
    <section id="questions" className={`${wrap} scroll-mt-8 pb-20 pt-4 lg:pb-28`}>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-5">
          <h2 data-reveal className={`${h2Big} mb-8`}>
            Questions
          </h2>

          <ul data-reveal style={delay(80)} className="hidden flex-col gap-1 lg:flex">
            {faqs.map((f, i) => (
              <li key={f.q}>
                <button
                  type="button"
                  onMouseEnter={() => setSelected(i)}
                  onFocus={() => setSelected(i)}
                  onClick={() => setSelected(i)}
                  aria-pressed={i === selected}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[18px] transition-colors ${
                    i === selected ? "bg-sand text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full transition-colors ${i === selected ? "bg-pine" : "bg-muted/50"}`}
                  />
                  {f.q}
                </button>
              </li>
            ))}
          </ul>

          <ul className="flex flex-col gap-[18px] lg:hidden">
            {faqs.map((f, i) => (
              <li key={f.q}>
                <button
                  type="button"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}
                  className={`flex items-center gap-3 text-left text-[18px] ${open === i ? "text-ink" : "text-muted"}`}
                >
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${open === i ? "bg-pine" : "bg-muted/50"}`}
                  />
                  {f.q}
                </button>
                {open === i ? <p className="mt-3 pl-5 text-[18px] leading-[1.5]">{f.a}</p> : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:col-span-6 lg:col-start-7 lg:block lg:pt-[calc(clamp(40px,5.4vw,80px)+2rem)]">
          <div className="flex flex-col gap-5" aria-live="polite">
            <p className="font-display text-[22px] font-semibold text-pine">{faq.q}</p>
            <p
              key={faq.q}
              className="animate-[fade_150ms_ease-out] text-[28px] leading-[1.3]"
              style={{ maxWidth: "26ch" }}
            >
              {faq.a}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA: a sentence with a blank ---------- */

export function StartSentence({ signedIn }: { signedIn: boolean }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const shown = name.trim() || "Support team";

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (name.trim()) sessionStorage.setItem(PENDING_WORKSPACE_KEY, name.trim());
    } catch {
      /* storage unavailable: the name is simply not carried over */
    }
    navigate(signedIn ? "/workspaces" : "/register");
  };

  return (
    <section className="bg-sand">
      <div
        className={`${wrap} grid items-center gap-12 py-20 lg:grid-cols-12 lg:gap-x-10 lg:py-24`}
      >
        <div className="lg:col-span-7">
          <h2 data-reveal className={`${h2Big} mb-8`}>
            Start in a minute
          </h2>
          <form
            data-reveal
            onSubmit={onSubmit}
            className="max-w-[18em] font-display text-[22px] font-semibold leading-[1.5] tracking-[-0.01em] md:text-[40px]"
          >
            <label htmlFor="workspace-name">Name your first workspace</label>{" "}
            <input
              id="workspace-name"
              name="workspace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Support team"
              maxLength={60}
              className="inline-block h-[1.35em] w-[7em] rounded-md bg-surface px-[0.3em] align-baseline text-ink outline-none placeholder:text-muted focus:bg-marker/40"
            />{" "}
            and{" "}
            <button
              type="submit"
              className="inline-block h-[1.35em] rounded-md bg-pine px-[0.35em] align-baseline text-paper transition-colors hover:bg-pine-dark active:translate-y-px"
            >
              create it
            </button>
            .
          </form>
          <p data-reveal style={delay(100)} className="mt-5 text-[18px] text-ink/75">
            {signedIn
              ? "It opens in your workspaces, ready for its first document."
              : "You'll make an account first. The name is kept for you."}
          </p>
        </div>

        <div data-reveal style={delay(160)} className="lg:col-span-4 lg:col-start-9">
          <div data-ui className="overflow-hidden rounded-lg bg-surface text-[14px]">
            <div className="flex items-center gap-2 px-4 pb-3 pt-4">
              <span className="grid size-7 place-items-center rounded bg-pine text-[13px] font-semibold text-paper">
                {shown.charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-[16px] font-semibold">{shown}</span>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-line">
              <div className="bg-surface px-4 py-3">
                <dt className="text-muted">Members</dt>
                <dd className="font-semibold">1, you as admin</dd>
              </div>
              <div className="bg-surface px-4 py-3">
                <dt className="text-muted">Documents</dt>
                <dd className="font-semibold">None yet</dd>
              </div>
            </dl>
            <p className="bg-paper/60 px-4 py-3 text-muted">
              Add a PDF, Markdown or text file to start asking.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer of tiles ---------- */

export function Footer() {
  const tile = "bg-surface p-6 lg:p-7";
  return (
    <footer className={`${wrap} py-10`}>
      <div className="grid gap-2 lg:grid-cols-12">
        <div className={`${tile} flex min-h-[220px] flex-col justify-between gap-6 lg:col-span-5`}>
          <p className="max-w-[22ch] text-[24px] leading-[1.3]">
            Answers from your own documents, with the passage to prove it.
          </p>
          <p className="text-[16px] text-muted">
            A multi-tenant knowledge platform, built in the open.
          </p>
        </div>
        <nav aria-label="Footer" className={`${tile} min-h-[220px] lg:col-span-4`}>
          <ul className="flex flex-col gap-2 text-[16px]">
            <li>
              <a href="#how" className="hover:text-pine">
                How it works
              </a>
            </li>
            <li>
              <a href="#pipeline" className="hover:text-pine">
                What happens to a file
              </a>
            </li>
            <li>
              <a href="#try" className="hover:text-pine">
                Try it
              </a>
            </li>
            <li>
              <a href="#questions" className="hover:text-pine">
                Questions
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-pine">
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
        <div className={`${tile} flex min-h-[220px] flex-col justify-between gap-4 lg:col-span-3`}>
          <span className="text-[16px] text-muted">Source code</span>
          <a
            href="https://github.com/JatinSasoni/Knowledge-Ops"
            className="text-[24px] font-semibold leading-[1.2] underline-offset-4 hover:text-pine hover:underline"
          >
            Knowledge-Ops on GitHub
          </a>
        </div>

        <div className="grid min-h-[160px] place-items-center bg-ink px-6 py-10 text-paper lg:col-span-8 lg:min-h-[320px]">
          <span className="font-display text-[13vw] font-extrabold leading-none tracking-[-0.04em] lg:text-[8vw]">
            <span className="bg-marker px-[0.06em] text-ink">Knowledge</span> Ops
          </span>
        </div>
        <Link
          to="/register"
          className="group flex min-h-[200px] flex-col justify-between bg-pine p-6 text-paper transition-colors hover:bg-pine-dark lg:col-span-4 lg:min-h-[320px] lg:p-7"
        >
          <span className="font-display text-[32px] font-bold leading-[1.1]">
            Create your workspace
          </span>
          <svg
            aria-hidden
            viewBox="0 0 48 48"
            className="size-12 self-end transition-transform duration-300 group-hover:translate-x-1.5"
          >
            <path
              d="M6 24h34M28 11l13 13-13 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="square"
            />
          </svg>
        </Link>
      </div>
    </footer>
  );
}
