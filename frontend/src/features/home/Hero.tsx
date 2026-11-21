import { Link } from "react-router";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ChatIcon,
  DocumentIcon,
  LockIcon,
  QuoteIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparkleIcon,
  UsersIcon,
} from "../../components/icons";
import { AskDemo } from "./AskDemo";
import { WaveDivider } from "./WaveDivider";
import { delay, sectionY, wrap } from "./layout";

/* ---------- Hero (sits inside the green block, under the nav) ---------- */

const heroFeatures = [
  { icon: ShieldCheckIcon, label: "Source-backed answers" },
  { icon: LockIcon, label: "Private workspaces" },
  { icon: UsersIcon, label: "Team collaboration" },
];

// No scroll-reveal in the hero: the first screen must show immediately, even before JS runs.
export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative pt-4 pb-36 lg:pt-6 lg:pb-44">
      <div
        className={`${wrap} grid items-center gap-12 lg:grid-cols-12 lg:items-start lg:gap-x-16`}
      >
        <div className="flex flex-col gap-7 lg:col-span-7 lg:pt-8 lg:pr-4">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-paper/20 bg-paper/10 px-3.5 py-1.5 text-[13px] font-medium text-paper/90">
            <SparkleIcon className="size-3.5 text-marker" />
            Knowledge Ops for your team
          </span>
          <h1 className="font-display text-[clamp(36px,3.8vw,58px)] leading-[1.05] font-extrabold tracking-[-0.03em]">
            <span className="block">Your team's knowledge.</span>
            <span className="block">
              One place. <span className="text-marker">Every answer.</span>
            </span>
          </h1>

          <p className="max-w-[54ch] text-[18px] leading-[1.55] text-paper/85 md:text-[20px]">
            Upload your documents, ask questions in plain language, and get answers backed by the
            exact source passages.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={signedIn ? "/workspaces" : "/register"}
              className="inline-flex items-center gap-2 rounded-md bg-paper px-5 py-3 text-[16px] font-semibold text-pine transition-colors hover:bg-sand active:translate-y-px"
            >
              {signedIn ? "Open your workspaces" : "Create a workspace"}
              <ArrowRightIcon className="size-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-md border border-paper/25 px-5 py-3 text-[16px] font-semibold text-paper transition-colors hover:bg-paper/10"
            >
              See how it works
            </a>
          </div>

          <ul className="flex flex-wrap gap-x-7 gap-y-3 border-t border-paper/15 pt-6">
            {heroFeatures.map(({ icon: FeatureIcon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[15px] text-paper/85">
                <FeatureIcon className="size-5 text-marker" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-xl shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] ring-1 ring-paper/10">
            <AskDemo />
          </div>
        </div>
      </div>

      <WaveDivider position="bottom" />
    </section>
  );
}

/*
 * Faint beige contour lines behind the green top block (nav + hero).
 * Ten gentle curves, each one shifted down a little, drawn in one SVG that covers the
 * block. A gradient mask fades them out towards the left, so the headline stays clean.
 */
const CONTOURS = Array.from({ length: 10 }, (_, i) => {
  const y = 40 + i * 64;
  return `M -60 ${y + 60} C 260 ${y - 40}, 560 ${y + 160}, 880 ${y + 50} S 1300 ${y - 30}, 1520 ${y + 90}`;
});

export function HeroLines() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 760"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full [mask-image:linear-gradient(to_left,black_35%,transparent_85%)]"
    >
      {CONTOURS.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="var(--color-paper)"
          strokeOpacity={0.07}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

/* ---------- Ask your documents. See the passage. ---------- */

const flow = [
  { icon: DocumentIcon, label: "Documents" },
  { icon: SearchIcon, label: "Search" },
  { icon: ChatIcon, label: "Answer" },
];

export function SeeThePassage() {
  return (
    <section id="ask" className={`${wrap} ${sectionY} scroll-mt-8`}>
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="flex flex-col gap-6 lg:col-span-6">
          <h2
            data-reveal
            className="font-display text-[clamp(30px,3.4vw,52px)] leading-[1.05] font-extrabold tracking-[-0.035em]"
          >
            <span className="block">Ask your documents.</span>
            <span className="block">See the passage.</span>
          </h2>
          <p data-reveal style={delay(80)} className="max-w-[50ch] text-[19px] leading-[1.55]">
            Citely answers questions from your team's own files, and highlights the exact passage
            behind every sentence.
          </p>
          <a
            data-reveal
            style={delay(140)}
            href="#try"
            className="inline-flex items-center gap-2 self-start text-[16px] font-semibold text-pine underline underline-offset-4"
          >
            Try the search settings
            <ArrowRightIcon className="size-4" />
          </a>
        </div>

        {/* The path a question takes */}
        <ol
          data-reveal
          style={delay(120)}
          className="flex items-center justify-center gap-3 lg:col-span-2 lg:flex-col"
          aria-label="How an answer is made"
        >
          {flow.map(({ icon: StepIcon, label }, i) => (
            <li key={label} className="flex items-center gap-3 lg:flex-col">
              <span className="flex flex-col items-center gap-1.5">
                <span className="flex size-14 items-center justify-center rounded-xl border border-line bg-surface text-pine shadow-sm">
                  <StepIcon className="size-6" />
                </span>
                <span className="text-[13px] font-semibold">{label}</span>
              </span>
              {i < flow.length - 1 && (
                <ArrowDownIcon className="size-4 -rotate-90 text-muted lg:rotate-0" />
              )}
            </li>
          ))}
        </ol>

        {/* What "see the passage" looks like */}
        <div data-reveal style={delay(180)} className="lg:col-span-4">
          <div
            data-ui
            className="overflow-hidden rounded-xl border border-line bg-surface text-[14px] shadow-[0_24px_60px_-36px_rgba(18,22,18,0.45)]"
          >
            <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
              <DocumentIcon className="size-4 text-pine" />
              <span className="font-semibold">Refund policy.pdf</span>
              <span className="ml-auto text-muted">page 3</span>
            </div>
            <div className="px-5 py-5 leading-[1.8] text-ink/80">
              Refunds are handled by the billing team.{" "}
              <mark className="rounded-sm bg-marker/70 px-0.5 text-ink">
                Approved refunds go back to the original payment method and usually arrive within 5
                to 10 business days.
              </mark>{" "}
              Customers on annual plans can ask for one within 30 days of purchase.
            </div>
            <div className="flex items-center gap-2 border-t border-line bg-paper/60 px-5 py-3 text-[13px] text-muted">
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded bg-marker px-1 text-[11px] font-bold text-ink">
                1
              </span>
              Cited in the answer to “How long do refunds take?”
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Everything your team needs ---------- */

const features = [
  {
    icon: ShieldCheckIcon,
    title: "Workspace isolation",
    text: "Every workspace keeps its documents separate. Search never crosses into another team.",
  },
  {
    icon: QuoteIcon,
    title: "Verifiable answers",
    text: "Every answer links back to the passage it came from, so anyone can check it.",
  },
  {
    icon: UsersIcon,
    title: "Team collaboration",
    text: "Invite members and choose who can manage people and settings.",
  },
  {
    icon: SearchIcon,
    title: "Smart discovery",
    text: "Find information by meaning, not exact words. It asks follow-up searches when needed.",
  },
];

export function Features() {
  return (
    <section className={`${wrap} pb-20 lg:pb-28`}>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
        <div className="flex flex-col gap-4 lg:order-last lg:col-span-4">
          <h2
            data-reveal
            className="font-display text-[clamp(32px,3.6vw,52px)] leading-[1] font-extrabold tracking-[-0.03em]"
          >
            Everything your team needs
          </h2>
          <p
            data-reveal
            style={delay(80)}
            className="max-w-[32ch] text-[17px] leading-[1.55] text-ink/75"
          >
            A private, shared place to find and trust what your team already knows.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-8 xl:grid-cols-4">
          {features.map(({ icon: FeatureIcon, title, text }, i) => (
            <li
              key={title}
              data-reveal
              style={delay(60 * i)}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-pine/40"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-pine/10 text-pine">
                <FeatureIcon className="size-5" />
              </span>
              <h3 className="text-[16px] font-semibold">{title}</h3>
              <p className="text-[14px] leading-[1.55] text-ink/70">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
