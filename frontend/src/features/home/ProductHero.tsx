import { Link } from "react-router";
import {
  ArrowRightIcon,
  CodeIcon,
  GridIcon,
  LockIcon,
  PlayIcon,
  QuoteIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "../../components/icons";
import { Wordmark } from "../../pages/AuthLayout";
import { WaveDivider } from "./WaveDivider";
import { wrap } from "./layout";
import { ProductPicture } from "./ProductPicture";

/*
 * The hero: text on the left; on the right, the product itself, built in HTML (not an image):
 * a browser window with the Workspaces screen, and the website chat widget floating over it,
 * answering a question WITH a cited source (what makes Citely different), on a gentle loop.
 * Below: a wave into a green band with four short promises.
 */

const promises = [
  { icon: UsersIcon, label: "Team workspaces" },
  { icon: QuoteIcon, label: "Cited answers" },
  { icon: CodeIcon, label: "Website widget" },
  { icon: ShieldCheckIcon, label: "Private by default" },
];

export function ProductHero({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <section className="relative overflow-hidden bg-paper">
        <HomeNav signedIn={signedIn} />

        <div
          className={`${wrap} grid items-center gap-14 pt-6 pb-16 lg:grid-cols-12 lg:gap-x-10 lg:pt-10 lg:pb-20`}
        >
          {/* Left: what it is and what to do */}
          <div className="flex flex-col gap-7 lg:col-span-6">
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-pine/10 px-3.5 py-1.5 text-[14px] font-semibold text-pine">
              <span className="size-2 rounded-full bg-pine" />
              Answers from your own documents
            </span>

            <h1 className="font-display text-[clamp(44px,5.6vw,84px)] leading-[1.02] font-extrabold tracking-[-0.035em] text-ink">
              Answers with a{" "}
              <span className="relative inline-block text-pine">
                source
                <HandUnderline />
              </span>
            </h1>

            <p className="max-w-[52ch] text-[18px] leading-[1.6] text-ink/75 md:text-[19px]">
              Give your team an AI assistant that answers from your own documents and shows the
              exact passage behind every answer. Add it to your website with one line of code.
            </p>

            <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 sm:gap-x-0">
              {promises.map(({ icon: PromiseIcon, label }, i) => (
                <li
                  key={label}
                  className={`flex items-center gap-2 text-[14px] leading-snug font-medium text-ink/80 sm:px-4 sm:first:pl-0 ${
                    i > 0 ? "sm:border-l sm:border-line" : ""
                  }`}
                >
                  <PromiseIcon className="size-5 shrink-0 text-pine" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-6">
              <Link
                to={signedIn ? "/workspaces" : "/register"}
                className="inline-flex items-center gap-2 rounded-full bg-pine px-6 py-3.5 text-[16px] font-semibold text-paper shadow-[0_12px_24px_-12px_rgba(31,77,58,0.7)] transition-[background-color,transform] hover:bg-pine-dark active:translate-y-px"
              >
                {signedIn ? "Open your workspaces" : "Create a workspace"}
                <ArrowRightIcon className="size-4" />
              </Link>
              <a
                href="#ask"
                className="group inline-flex items-center gap-2.5 text-[16px] font-semibold text-pine"
              >
                <PlayIcon className="size-7 transition-transform group-hover:scale-110" />
                Try it live
              </a>
            </div>
          </div>

          {/* Right: the product, drawn in HTML */}
          <div className="relative lg:col-span-6">
            <ProductPicture />
          </div>
        </div>
      </section>

      {/* Wave into a green band with the four promises in plain words */}
      <section aria-label="Why Citely" className="relative bg-pine pt-24 pb-14 text-paper">
        <WaveDivider position="top" />
        <ul className={`${wrap} grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0`}>
          {[
            { icon: QuoteIcon, label: "Answers backed by your documents" },
            { icon: GridIcon, label: "One workspace per team" },
            { icon: LockIcon, label: "Nothing leaves a workspace" },
            { icon: CodeIcon, label: "Works on any website" },
          ].map(({ icon: BandIcon, label }, i) => (
            <li
              key={label}
              className={`flex items-center justify-center gap-3 text-[16px] font-medium ${
                i > 0 ? "lg:border-l lg:border-paper/20" : ""
              }`}
            >
              <BandIcon className="size-6 shrink-0 text-marker" />
              {label}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

// The hand-drawn yellow stroke under "source".
function HandUnderline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 24"
      preserveAspectRatio="none"
      className="absolute -bottom-[0.12em] left-[-2%] h-[0.22em] w-[104%] text-marker"
    >
      <path
        d="M4 16 C 60 6, 140 4, 296 12 M 30 19 C 110 13, 200 13, 270 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- Navigation ---------- */

const navLink = "hidden text-ink/80 transition-colors hover:text-pine lg:inline";

function HomeNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className={`${wrap} flex items-center justify-between gap-6 py-5`}>
      <Link to="/" aria-label="Citely home" className="shrink-0">
        <Wordmark className="h-8 md:h-9" />
      </Link>
      <nav aria-label="Main" className="flex items-center gap-4 text-[16px] md:gap-7">
        <a href="#ask" className={navLink}>
          Try it
        </a>
        <a href="#how" className={navLink}>
          How it works
        </a>
        <a href="#pipeline" className={navLink}>
          Your files
        </a>
        <a href="#questions" className={navLink}>
          Questions
        </a>
        {signedIn ? (
          <Link to="/workspaces" className={action}>
            Open workspaces
          </Link>
        ) : (
          <>
            <Link to="/login" className="whitespace-nowrap text-ink/80 hover:text-pine">
              Sign in
            </Link>
            <Link to="/register" className={action}>
              <span className="sm:hidden">Sign up</span>
              <span className="hidden sm:inline">Create a workspace</span>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

const action =
  "inline-flex items-center rounded-full bg-pine px-4 py-2.5 text-[15px] font-semibold whitespace-nowrap text-paper transition-[background-color,transform] hover:bg-pine-dark active:translate-y-px md:px-5";
