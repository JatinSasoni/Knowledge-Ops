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
import { AskAnything } from "../features/home/AskAnything";
import { Features } from "../features/home/Hero";
import { ProductHero } from "../features/home/ProductHero";
import { useReveal } from "../features/home/useReveal";

export function HomePage() {
  const { data: user } = useMe();
  const signedIn = Boolean(user);
  useReveal();

  return (
    <div className="overflow-x-clip">
      <ProductHero signedIn={signedIn} />

      <main>
        <AskAnything />
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
