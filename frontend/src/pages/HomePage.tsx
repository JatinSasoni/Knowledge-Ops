import { Link } from "react-router";
import { useMe } from "../features/auth/hooks";
import { AskDemo } from "../features/home/AskDemo";
import { delay, h2Big, sectionY, wrap } from "../features/home/layout";
import { RetrievalDemo } from "../features/home/RetrievalDemo";
import {
  Comparison,
  Footer,
  HowItWorks,
  Pipeline,
  Questions,
  StartSentence,
  Teams,
} from "../features/home/Sections";
import { useReveal } from "../features/home/useReveal";
import { Wordmark } from "./AuthLayout";

const primaryLook =
  "items-center rounded-md bg-pine px-5 py-3 text-[16px] font-semibold text-paper transition-colors hover:bg-pine-dark active:translate-y-px";
const primary = `inline-flex ${primaryLook}`;

const promises = [
  ["Every answer cites its source.", "Open the passage and read it yourself."],
  ["Each team keeps its own documents.", "Search never crosses into another workspace."],
  ["It won't guess.", "When the documents don't say, it tells you and offers to file a ticket."],
] as const;

export function HomePage() {
  const { data: user } = useMe();
  const signedIn = Boolean(user);
  useReveal();

  return (
    <div className="overflow-x-clip">
      <header className={`${wrap} flex items-center justify-between gap-6 py-5`}>
        <Link to="/" aria-label="Knowledge Ops home" className="whitespace-nowrap">
          <Wordmark size="sm" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5 text-[16px] md:gap-7">
          <a href="#how" className="hidden transition-colors hover:text-pine lg:inline">
            How it works
          </a>
          <a href="#pipeline" className="hidden transition-colors hover:text-pine lg:inline">
            Under the hood
          </a>
          <a href="#try" className="hidden transition-colors hover:text-pine lg:inline">
            Try it
          </a>
          <a href="#questions" className="hidden transition-colors hover:text-pine lg:inline">
            Questions
          </a>
          {signedIn ? (
            <Link to="/workspaces" className={primary}>
              Open workspaces
            </Link>
          ) : (
            <>
              <Link to="/login" className="whitespace-nowrap transition-colors hover:text-pine">
                Sign in
              </Link>
              <Link to="/register" className={`${primaryLook} hidden sm:inline-flex`}>
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className={`${wrap} pb-20 pt-10 lg:pb-28 lg:pt-16`}>
          <h1 className="font-display text-[clamp(32px,7vw,108px)] font-extrabold leading-[0.94] tracking-[-0.045em]">
            <span className="block">Ask your documents.</span>
            <span className="block">See the passage.</span>
          </h1>

          <div className="mt-12 grid items-start gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-x-10">
            <div className="flex flex-col gap-8 lg:col-span-5">
              <p className="max-w-[30ch] text-[24px] leading-[1.4]">
                Knowledge Ops answers questions from your team's own files, and highlights the exact
                passage behind every sentence.
              </p>
              <div className="flex flex-wrap items-center gap-5">
                <Link to={signedIn ? "/workspaces" : "/register"} className={primary}>
                  {signedIn ? "Open your workspaces" : "Create a workspace"}
                </Link>
                <a
                  href="#try"
                  className="text-[16px] font-semibold text-pine underline underline-offset-4"
                >
                  Try the search settings
                </a>
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {promises.map(([lead, rest]) => (
                  <li key={lead} className="bg-sand px-5 py-4 text-[18px] leading-[1.45]">
                    <strong className="font-display text-[20px] font-bold">{lead}</strong>{" "}
                    <span className="text-ink/80">{rest}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7">
              <AskDemo />
            </div>
          </div>
        </section>

        <HowItWorks />
        <Pipeline />

        <section id="try" className={`${wrap} ${sectionY} scroll-mt-8`}>
          <div className="mb-12 grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-x-10">
            <h2 data-reveal className={`${h2Big} lg:col-span-6`}>
              Tune what it reads
            </h2>
            <p
              data-reveal
              style={delay(80)}
              className="text-[20px] leading-[1.5] lg:col-span-5 lg:col-start-8"
            >
              Every answer starts by pulling a few passages from one workspace. Change the settings
              and watch which passages make the cut.
            </p>
          </div>
          <div data-reveal style={delay(160)}>
            <RetrievalDemo />
          </div>
          <p className="mt-5 text-[16px] text-muted">
            Switch to Finance: the same question finds nothing useful there, because Support's
            documents stay in Support.
          </p>
        </section>

        <Teams />
        <Comparison />
        <Questions />
        <StartSentence signedIn={signedIn} />
      </main>

      <Footer />
    </div>
  );
}
