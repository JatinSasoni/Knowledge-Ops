import { useState } from "react";
import { PENDING_WORKSPACE_KEY } from "../home/layout";

const panel = "hidden flex-col justify-center gap-10 px-10 py-16 lg:flex xl:px-20";
const statement =
  "max-w-[16ch] text-balance font-display text-[clamp(40px,4vw,64px)] font-extrabold leading-[1] tracking-[-0.035em]";

/* Sign in: what an answer looks like (a labelled example, not the visitor's own history) */

export function SignInAside() {
  return (
    <aside className={`${panel} bg-ink text-paper`}>
      <p className={statement}>Every answer shows its source.</p>

      <div
        data-ui
        className="max-w-[560px] overflow-hidden rounded-lg bg-surface text-[14px] leading-[1.55] text-ink"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <span className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded bg-pine text-[12px] font-semibold text-paper">
              S
            </span>
            <span className="font-semibold">Support</span>
            <span className="text-muted">(example)</span>
          </span>
          <span className="text-muted">Sample answer</span>
        </div>
        <div className="flex flex-col gap-4 px-4 py-4">
          <p className="self-end rounded-lg bg-paper px-3 py-2 font-medium">
            Do we refund annual plans mid-term?
          </p>
          <div>
            <span className="mb-1 block text-[13px] font-semibold text-pine">Knowledge Ops</span>
            Yes, pro rata for the unused full months, but not for the current month.
            <span className="mx-0.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded bg-marker px-1 align-[1px] text-[11px] font-semibold">
              1
            </span>
          </div>
          <div className="rounded-md bg-paper px-3 py-3">
            <p className="mb-1.5 text-[13px] text-muted">
              <span className="font-semibold text-ink">Source 1</span> Refund policy.pdf, page 4
            </p>
            <p>
              Annual plans.{" "}
              <mark className="bg-marker px-0.5 text-ink">
                Plans cancelled mid-term are refunded pro rata for the unused full months.
              </mark>{" "}
              The current month is not refunded.
            </p>
          </div>
        </div>
      </div>

      <p className="max-w-[44ch] text-[18px] leading-[1.5] text-paper/80">
        Ask in plain words. Open the highlighted passage to check the answer yourself.
      </p>
    </aside>
  );
}

/* Create account: what happens next */

const nextSteps = [
  ["Name a workspace", "One per team. You're its admin."],
  ["Add your documents", "PDF, Markdown or text. They're read in the background."],
  ["Ask anything", "Every answer shows the passage it came from."],
] as const;

function readPendingName() {
  try {
    return sessionStorage.getItem(PENDING_WORKSPACE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function RegisterAside() {
  // Carried over from the home page's "Name your first workspace" sentence.
  const [pending] = useState(readPendingName);
  const name = pending || "Your first workspace";

  return (
    <aside className={`${panel} bg-pine text-paper`}>
      <p className={statement}>Your team's answers, with the proof.</p>

      <ol className="flex max-w-[560px] flex-col gap-2">
        {nextSteps.map(([step, detail], i) => (
          <li
            key={step}
            className={`rounded-md px-5 py-4 ${i === 0 ? "bg-paper text-ink" : "bg-pine-dark text-paper"}`}
          >
            <span className="block font-display text-[24px] font-bold leading-[1.15]">{step}</span>
            <span className={`text-[16px] ${i === 0 ? "text-ink/75" : "text-paper/75"}`}>
              {detail}
            </span>
            {i === 0 ? (
              <span
                data-ui
                className="mt-4 flex items-center gap-2 rounded-md bg-surface px-3 py-2.5 text-[14px]"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded bg-pine text-[13px] font-semibold text-paper">
                  {name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate font-semibold">{name}</span>
                <span className="ml-auto shrink-0 rounded bg-pine px-2 py-0.5 text-[12px] font-semibold text-paper">
                  Admin
                </span>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </aside>
  );
}
