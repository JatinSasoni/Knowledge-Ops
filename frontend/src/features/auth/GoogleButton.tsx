import { useEffect, useRef, useState } from "react";
import { FormError } from "../../components/ui";
import { useGoogleLogin } from "./hooks";

/*
 * "Continue with Google", using Google Identity Services (GIS).
 *
 * 1. Load Google's script (accounts.google.com/gsi/client), once for the whole app.
 * 2. initialize({ client_id, callback }) + renderButton(): Google draws its own button
 *    (an iframe from accounts.google.com), so the look and the account picker are Google's.
 * 3. The user picks an account in Google's popup. Google then calls our `callback` with
 *    { credential }: an ID token, a JWT signed by Google that says who the user is.
 * 4. We POST that credential to our API (/auth/google). The SERVER verifies the signature
 *    and the audience; the browser never decides who is logged in.
 */

// The few parts of Google's script we use.
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        ux_mode?: "popup" | "redirect";
      }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};
declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Load the script only once, even if several pages mount the button.
let scriptPromise: Promise<void> | null = null;
function loadGoogleScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // allow a retry on the next mount
      reject(new Error("Couldn't load Google sign-in"));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

export function GoogleButton({ onSuccess }: { onSuccess: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const google = useGoogleLogin();
  const [loadError, setLoadError] = useState(false);

  // Google keeps the callback it was given at initialize(); keep it pointing at the
  // latest render's functions without re-initializing.
  const latest = useRef({ mutate: google.mutate, onSuccess });
  useEffect(() => {
    latest.current = { mutate: google.mutate, onSuccess };
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !container.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: "popup",
          callback: ({ credential }) =>
            latest.current.mutate(credential, { onSuccess: () => latest.current.onSuccess() }),
        });
        window.google.accounts.id.renderButton(container.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: Math.min(container.current.offsetWidth || 400, 400), // Google's max is 400px
        });
      })
      .catch(() => setLoadError(true));

    return () => {
      cancelled = true;
    };
  }, []);

  // No client id configured (e.g. a fresh checkout without frontend/.env): show nothing.
  if (!CLIENT_ID) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Google renders its button inside this box. Fixed height = no jump while it loads. */}
      <div ref={container} className="flex h-11 w-full justify-center" />
      {google.isPending && <p className="text-center text-sm text-muted">Signing you in…</p>}
      <FormError
        message={
          loadError
            ? "Google sign-in couldn't load. Check your connection, or use your email instead."
            : google.isError
              ? google.error.message
              : undefined
        }
      />
    </div>
  );
}

// The "or" line between the Google button and the email form.
export function OrDivider() {
  if (!CLIENT_ID) return null; // no Google button, so nothing to divide
  return (
    <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
