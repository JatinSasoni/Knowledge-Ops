import { useEffect, useState } from "react";
import {
  ArrowUpIcon,
  ChatIcon,
  ChevronsUpDownIcon,
  CloseIcon,
  CodeIcon,
  DocumentIcon,
  LogOutIcon,
  SettingsIcon,
  UsersIcon,
} from "../../components/icons";
import { Wordmark } from "../../pages/AuthLayout";
import type { Citation } from "../../types";
import { Answer, Sources } from "../chat/Answer";
import { useReducedMotion } from "./useReducedMotion";

/*
 * The hero picture: Citely's REAL interface, not an illustration.
 * - The window copies the app shell (pages/AppLayout + shell/Sidebar) and the Documents page
 *   (workspace/WorkspaceLayout + DocumentsTab) class for class. It is laid out at real size
 *   (1040 × 640) and scaled down, so every proportion matches the app.
 * - The widget copies embed/WidgetApp, and renders its answer with the app's own Answer and
 *   Sources components, so citations look exactly like they do in the product.
 * Everything here is a picture: hidden from screen readers, no real links or inputs.
 */

const WINDOW_W = 1040;
const WINDOW_H = 640;
const SCALE = 0.6;

export function ProductPicture() {
  return (
    <div
      aria-hidden
      inert
      className="relative mx-auto h-[500px] max-w-[640px] select-none sm:h-[520px]"
    >
      {/* Backdrop: the big green circle and small accent strokes */}
      <div className="absolute top-4 right-[-10%] size-[460px] rounded-full bg-pine" />
      <svg viewBox="0 0 40 40" className="absolute top-12 right-[-6%] size-10 text-pine">
        <path
          d="M8 30 L14 10 M20 32 L32 18 M22 38 L36 34"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      {/* The app window, scaled from real size and tilted back into the page.
          perspective() gives the depth; rotateY turns the right side away from us (the left stays close),
          rotateX leans the top back a little. The widget in front stays flat. */}
      <div
        className="absolute top-12 left-[-2%] hidden overflow-hidden rounded-xl shadow-[0_40px_70px_-30px_rgba(18,22,18,0.5)] ring-1 ring-line sm:block"
        style={{
          width: WINDOW_W * SCALE,
          height: WINDOW_H * SCALE,
          transform: "perspective(1800px) rotateY(14deg) rotateX(5deg)",
          transformOrigin: "left center",
        }}
      >
        <div
          className="origin-top-left"
          style={{ width: WINDOW_W, height: WINDOW_H, transform: `scale(${SCALE})` }}
        >
          <AppWindow />
        </div>
      </div>

      {/* "Embed anywhere" tag and a hand-drawn arrow towards the widget */}
      <div className="absolute top-0 right-[16%] hidden items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink shadow-[0_10px_24px_-14px_rgba(18,22,18,0.5)] sm:flex">
        <CodeIcon className="size-4 text-pine" />
        Embed anywhere
      </div>
      <svg
        viewBox="0 0 60 80"
        className="absolute top-8 right-[6%] hidden h-16 w-12 text-ink/70 sm:block"
      >
        <path
          d="M6 6 C 40 8, 52 30, 44 70 M 36 60 L 44 72 L 52 61"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <WidgetReplica />
    </div>
  );
}

/* ---------- The app: sidebar + Documents page, at real size ---------- */

const documents = [
  { label: "PDF", title: "Refund policy.pdf", meta: "Added 18 Nov 2026 · 2.4 MB", status: "Ready" },
  { label: "MD", title: "Billing FAQ.md", meta: "Added 18 Nov 2026 · 18 KB", status: "Ready" },
  {
    label: "PDF",
    title: "Escalation guide.pdf",
    meta: "Added 20 Nov 2026 · 1.1 MB",
    status: "Ready",
  },
  { label: "TXT", title: "Shipping times.txt", meta: "Added 21 Nov 2026 · 6 KB", status: "Ready" },
  {
    label: "PDF",
    title: "Annual plans 2027.pdf",
    meta: "Added 21 Nov 2026 · 3.8 MB",
    status: "Processing",
  },
];

const statusStyle: Record<string, string> = {
  Ready: "bg-pine/12 text-pine",
  Processing: "bg-marker/50 text-ink",
};

function AppWindow() {
  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      {/* browser bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-5 py-3">
        <span className="size-3 rounded-full bg-[#ec6a5e]" />
        <span className="size-3 rounded-full bg-[#f4bf4f]" />
        <span className="size-3 rounded-full bg-[#61c554]" />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar (shell/Sidebar) */}
        <div className="flex w-64 shrink-0 flex-col border-r border-line bg-sand/50">
          <div className="px-5 pt-5 pb-4">
            <Wordmark />
          </div>
          <div className="px-3">
            <div className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-2.5 shadow-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pine font-display text-[16px] font-extrabold text-paper">
                A
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">Acme Support</span>
                <span className="block text-xs text-muted">Admin · Public</span>
              </span>
              <ChevronsUpDownIcon className="size-4 shrink-0 text-muted" />
            </div>
          </div>
          <div className="mt-5 flex flex-1 flex-col gap-0.5 px-3">
            <p className="px-3 pb-2 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
              Workspace
            </p>
            <SideItem icon={DocumentIcon} label="Documents" count={5} active />
            <SideItem icon={ChatIcon} label="Ask" />
            <SideItem icon={UsersIcon} label="Members" count={6} />
            <SideItem icon={SettingsIcon} label="Settings" />
          </div>
          <div className="flex items-center gap-3 border-t border-line px-4 py-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-paper">
              J
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink/80">jatin@acme.com</span>
            <LogOutIcon className="size-4 text-muted" />
          </div>
        </div>

        {/* Documents page (WorkspaceLayout header + DocumentsTab list) */}
        <div className="min-w-0 flex-1 px-10 py-9">
          <div className="mb-7 border-b border-line pb-6">
            <p className="text-[13px] font-medium text-muted">Acme Support</p>
            <p className="mt-1 font-display text-[34px] leading-tight font-extrabold tracking-tight">
              Documents
            </p>
            <p className="mt-2 max-w-2xl text-[15px] text-ink/70">
              Upload files and follow their processing. Ready documents can be searched and asked
              about.
            </p>
          </div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="w-full max-w-sm rounded-md border border-line bg-surface px-3 py-2.5 text-muted/80">
              Search by title
            </span>
            <span className="shrink-0 text-sm text-muted">5 documents</span>
          </div>
          <ul className="overflow-hidden rounded-lg bg-surface">
            {documents.map((d, i) => (
              <li
                key={d.title}
                className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <span className="grid h-10 w-9 shrink-0 place-items-center rounded-sm bg-paper text-[10px] font-bold text-muted">
                  {d.label}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">{d.title}</span>
                  <span className="text-sm text-muted">{d.meta}</span>
                </span>
                <span
                  className={`ml-auto shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${statusStyle[d.status]}`}
                >
                  {d.status}
                </span>
                <span className="rounded-md px-3 py-1.5 text-sm font-semibold text-muted">
                  Delete
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SideItem({
  icon: ItemIcon,
  label,
  count,
  active = false,
}: {
  icon: typeof DocumentIcon;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <span
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium ${
        active
          ? "bg-surface text-ink shadow-sm ring-1 ring-line before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-pine"
          : "text-ink/70"
      }`}
    >
      <ItemIcon />
      {label}
      {count !== undefined && (
        <span className="ml-auto rounded-full bg-sand px-1.5 py-px text-[11px] font-semibold text-muted tabular-nums">
          {count}
        </span>
      )}
    </span>
  );
}

/* ---------- The website widget (embed/WidgetApp), playing a conversation ---------- */

const conversations: { ask: string; answer: string; citation: Citation }[] = [
  {
    ask: "How long do refunds take?",
    answer: "Refunds go back to the original payment method within 5 to 10 business days.",
    citation: {
      n: 1,
      documentId: "refund-policy",
      documentTitle: "Refund policy.pdf",
      index: 2,
      content: "Money goes back to the original payment method within 5 to 10 business days.",
      similarity: 0.82,
    },
  },
  {
    ask: "Can I change my plan mid-month?",
    answer: "Yes. Upgrades apply right away, and the difference is added to your next invoice.",
    citation: {
      n: 1,
      documentId: "billing-faq",
      documentTitle: "Billing FAQ.md",
      index: 1,
      content:
        "Upgrades take effect immediately; the prorated difference appears on the next invoice.",
      similarity: 0.79,
    },
  },
];

// One round: 0 = question only, 1 = thinking, 2 = typing the answer, 3 = done (cited), then next.
function useConversation(reduced: boolean) {
  const [round, setRound] = useState(0);
  const [step, setStep] = useState(reduced ? 3 : 0);
  const [typed, setTyped] = useState(0);
  const conversation = conversations[round % conversations.length]!;
  const words = conversation.answer.split(" ");

  useEffect(() => {
    if (reduced) return;
    let timer: number;
    if (step === 0) timer = window.setTimeout(() => setStep(1), 900);
    else if (step === 1) timer = window.setTimeout(() => setStep(2), 1100);
    else if (step === 2) {
      if (typed < words.length) timer = window.setTimeout(() => setTyped((n) => n + 1), 75);
      else timer = window.setTimeout(() => setStep(3), 250);
    } else {
      timer = window.setTimeout(() => {
        setRound((r) => r + 1);
        setTyped(0);
        setStep(0);
      }, 4500);
    }
    return () => window.clearTimeout(timer);
  }, [step, typed, words.length, reduced]);

  const answer =
    step === 3 || reduced ? `${conversation.answer} [1]` : words.slice(0, typed).join(" ");
  return { conversation, step: reduced ? 3 : step, answer };
}

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

function WidgetReplica() {
  const reduced = useReducedMotion();
  const { conversation, step, answer } = useConversation(reduced);

  return (
    <div className="absolute right-0 bottom-0 flex h-[440px] w-full flex-col overflow-hidden rounded-2xl bg-surface text-ink shadow-[0_24px_60px_-12px_rgba(0,0,0,0.4)] sm:right-[-4%] sm:w-[340px] sm:origin-bottom-right sm:scale-[0.82]">
      {/* Header */}
      <div className="flex items-center gap-3 bg-pine px-4 py-3 text-paper">
        <BrandIcon className="size-9 rounded-xl ring-1 ring-paper/20" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">Acme Support</p>
          <p className="text-[12px] text-paper/75">Answers with sources</p>
        </div>
        <CloseIcon className="size-4 text-paper/80" />
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
        <div key={conversation.ask} className="chat-enter flex justify-end">
          <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-[14px] text-paper">
            {conversation.ask}
          </p>
        </div>

        {step >= 1 && (
          <div className="flex gap-2.5 text-[14px]">
            <BrandIcon className="mt-0.5 size-7 rounded-lg" />
            <div className="min-w-0 flex-1">
              {step === 1 ? (
                <span className="chat-dots flex gap-1 pt-2">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <>
                  <Answer
                    content={answer}
                    citations={[conversation.citation]}
                    onCite={() => {}}
                    streaming={step === 2}
                  />
                  <Sources content={answer} citations={[conversation.citation]} onCite={() => {}} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Question box */}
      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-paper/40 p-1.5 pl-3">
          <span className="flex-1 py-1.5 text-[14px] text-muted/70">Ask a question…</span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-line text-muted">
            <ArrowUpIcon className="size-4" />
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          Powered by <span className="font-semibold text-ink/80">Citely</span>
        </p>
      </div>
    </div>
  );
}
