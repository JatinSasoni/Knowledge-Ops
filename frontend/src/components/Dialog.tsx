import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

/*
 * A modal built on the browser's own <dialog> element. With showModal() the browser
 * handles the hard parts for us: focus moves inside and stays there, Escape closes it,
 * and the rest of the page can't be clicked while it's open.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  // Keep the real <dialog> in sync with the `open` prop.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose} // fired by Escape too
      // A click on the dimmed area outside the box lands on the <dialog> itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
      className="m-auto w-[min(480px,calc(100%-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="dialog-title" className="font-display text-xl font-bold">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-1 rounded-md p-1.5 text-muted hover:bg-sand hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
