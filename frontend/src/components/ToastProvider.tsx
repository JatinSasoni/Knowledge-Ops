import { useCallback, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastTone } from "../lib/toast";
import { CloseIcon } from "./icons";

type Toast = { id: number; message: string; tone: ToastTone };

const SHOW_MS = 4000;

/*
 * Short messages at the top of the screen ("Invitation sent", "Saved"…).
 * Wraps the whole app (main.tsx), so any page can call useToast().
 * Each toast disappears after 4 seconds, or when its × is clicked.
 * role="status" + aria-live: screen readers announce it without moving focus.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      // Keep at most 3 on screen: the oldest makes room for the newest.
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), SHOW_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-lg px-4 py-3 text-[14px] shadow-lg ${
              toast.tone === "error" ? "bg-danger text-paper" : "bg-ink text-paper"
            }`}
            style={{ animation: "toast-in 0.2s ease-out" }}
          >
            <span className="min-w-0 flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 rounded p-0.5 text-paper/70 hover:text-paper"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
