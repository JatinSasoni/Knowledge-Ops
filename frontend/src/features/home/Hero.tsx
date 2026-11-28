import { QuoteIcon, SearchIcon, ShieldCheckIcon, UsersIcon } from "../../components/icons";
import { delay, wrap } from "./layout";

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
