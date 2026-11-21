import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

/*
 * A styled replacement for <select>.
 * A native <select>'s open list is drawn by the operating system, so CSS can't style it.
 * This one is a button that opens our own list, following the ARIA "combobox + listbox"
 * pattern so screen readers and keyboards work like with a real <select>:
 *   ↓ / ↑ / Enter / Space  open the list, move, choose
 *   Home / End             first / last option
 *   Escape / Tab           close without changing
 * Focus stays on the button; `aria-activedescendant` tells assistive tech which option
 * is highlighted.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0); // highlighted option while the list is open
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];

  // Close when clicking anywhere outside.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function openList() {
    setActive(selectedIndex); // start on the current choice, like a native select
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    button.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-sm font-medium">
        {label}
      </span>

      <div ref={box} className="relative">
        <button
          ref={button}
          type="button"
          role="combobox"
          aria-labelledby={`${id}-label`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? `${id}-option-${active}` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          className={`flex w-full items-center gap-2 rounded-md border bg-surface px-3 py-2.5 text-left transition-colors outline-none ${
            open ? "border-pine" : "border-line hover:border-ink/30 focus-visible:border-pine"
          }`}
        >
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium">{selected?.label}</span>
            {selected?.description && <span className="text-muted"> · {selected.description}</span>}
          </span>
          <ChevronDownIcon
            className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-xl"
            style={{ animation: "fade 0.12s ease-out" }}
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(index)}
                  // mousedown (not click) so the button doesn't lose focus first
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(index);
                  }}
                  className={`flex items-start gap-3 rounded-md px-3 py-2.5 ${
                    index === active ? "bg-sand/70" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">{option.label}</span>
                    {option.description && (
                      <span className="block text-[13px] text-muted">{option.description}</span>
                    )}
                  </span>
                  <CheckIcon
                    className={`mt-0.5 size-4 shrink-0 text-pine ${isSelected ? "" : "invisible"}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
