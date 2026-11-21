import { Link } from "react-router";
import { useMe } from "../features/auth/hooks";
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
import { Features, Hero, HeroLines, SeeThePassage } from "../features/home/Hero";
import { useReveal } from "../features/home/useReveal";
import { Wordmark } from "./AuthLayout";

// Beige button with green text, for the green nav bar.
const primaryLook =
  "items-center rounded-md bg-paper px-5 py-2.5 text-[15px] font-semibold text-pine transition-colors hover:bg-sand active:translate-y-px";
const primary = `inline-flex ${primaryLook}`;

export function HomePage() {
  const { data: user } = useMe();
  const signedIn = Boolean(user);
  useReveal();

  return (
    <div className="overflow-x-clip">
      {/* Forest green top block: nav + hero share one background */}
      <div className="relative overflow-hidden bg-pine text-paper">
        <HeroLines />
        <header className={`${wrap} relative flex items-center justify-between gap-6 py-5`}>
          <Link to="/" aria-label="Citely home" className="shrink-0">
            <Wordmark onDark className="h-8 md:h-9" />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5 text-[16px] md:gap-7">
            <a
              href="#how"
              className="hidden text-paper/80 transition-colors hover:text-paper lg:inline"
            >
              How it works
            </a>
            <a
              href="#pipeline"
              className="hidden text-paper/80 transition-colors hover:text-paper lg:inline"
            >
              Your files
            </a>
            <a
              href="#try"
              className="hidden text-paper/80 transition-colors hover:text-paper lg:inline"
            >
              Try it
            </a>
            <a
              href="#questions"
              className="hidden text-paper/80 transition-colors hover:text-paper lg:inline"
            >
              Questions
            </a>
            {signedIn ? (
              <Link to="/workspaces" className={primary}>
                Open workspaces
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="whitespace-nowrap text-paper/80 transition-colors hover:text-paper"
                >
                  Sign in
                </Link>
                <Link to="/register" className={`${primaryLook} hidden sm:inline-flex`}>
                  Create account
                </Link>
              </>
            )}
          </nav>
        </header>
        <Hero signedIn={signedIn} />
      </div>

      <main>
        <SeeThePassage />
        <Features />

        <HowItWorks />
        <Teams />
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

        <Comparison />
        <Questions />
        <StartSentence signedIn={signedIn} />
      </main>

      <Footer />
    </div>
  );
}
