import { GlobeIcon, LockIcon } from "../../components/icons";
import type { Visibility } from "../../types";

const OPTIONS = [
  {
    value: "PRIVATE",
    icon: LockIcon,
    title: "Private",
    text: "Only members you add can ask questions. For internal documents.",
  },
  {
    value: "PUBLIC",
    icon: GlobeIcon,
    title: "Public",
    text: "Members, plus visitors to your website through the chat widget. For help docs and FAQs.",
  },
] as const;

/*
 * Two selectable cards. Underneath they are real radio buttons inside a <fieldset>, so
 * keyboard (arrow keys) and screen readers work like any radio group; the input is
 * visually hidden and the card shows its state with `has-checked:` styles.
 */
export function VisibilityPicker({
  value,
  onChange,
  name = "visibility",
}: {
  value: Visibility;
  onChange: (value: Visibility) => void;
  name?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">Who can ask questions</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map(({ value: option, icon: OptionIcon, title, text }) => (
          <label
            key={option}
            className="flex cursor-pointer gap-3 rounded-lg border border-line bg-surface p-3.5 transition-colors hover:border-pine/40 has-checked:border-pine has-checked:bg-pine/5 has-checked:ring-1 has-checked:ring-pine has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-pine"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-pine/10 text-pine">
              <OptionIcon className="size-4" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold">{title}</span>
              <span className="text-[13px] leading-snug text-muted">{text}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// Small label shown next to a workspace's name: 🔒 Private / 🌐 Public.
export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const isPublic = visibility === "PUBLIC";
  const BadgeIcon = isPublic ? GlobeIcon : LockIcon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${
        isPublic ? "bg-marker/40 text-ink" : "bg-sand text-ink/80"
      }`}
    >
      <BadgeIcon className="size-3" />
      {isPublic ? "Public" : "Private"}
    </span>
  );
}
