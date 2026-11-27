import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { FormError } from "../components/ui";
import { useMe } from "../features/auth/hooks";

/*
 * The Citely logo (image). Two versions of the same file:
 *   citely-logo.png       beige letters, for dark backgrounds (green, black)
 *   citely-logo-dark.png  dark letters, for beige/light backgrounds
 * The orange document icon is identical in both. Size it with a height class (h-7, h-9…);
 * width/height attributes reserve the space before the image loads, so nothing jumps.
 */
export function Wordmark({
  onDark = false,
  className = "h-7",
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <img
      src={onDark ? "/citely-logo.png" : "/citely-logo-dark.png"}
      alt="Citely"
      width={315}
      height={96}
      className={`w-auto ${className}`}
    />
  );
}

export function AuthLayout({
  title,
  intro,
  aside,
  asideSide = "right",
  redirectIfSignedIn = true,
  children,
}: {
  title: string;
  intro: string;
  aside: ReactNode;
  asideSide?: "left" | "right";
  // Login/register send signed-in people to their workspaces. The reset-password page
  // turns this off: someone signed in may still open a reset link from their email.
  redirectIfSignedIn?: boolean;
  children: ReactNode;
}) {
  const { data: user, isPending } = useMe();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/workspaces";
  if (redirectIfSignedIn && !isPending && user) return <Navigate to={from} replace />;

  return (
    <div
      className={`grid min-h-dvh ${asideSide === "left" ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"}`}
    >
      <main
        className={`flex flex-col px-5 py-6 md:px-10 ${asideSide === "left" ? "lg:order-last" : ""}`}
      >
        <header className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="Citely home" className="whitespace-nowrap">
            <Wordmark />
          </Link>
          <Link to="/" className="text-[15px] text-muted transition-colors hover:text-pine">
            Back to home
          </Link>
        </header>

        <section className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-8 py-14">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[44px] font-extrabold leading-[1] tracking-[-0.035em]">
              {title}
            </h1>
            <p className="text-[18px] leading-[1.5] text-ink/80">{intro}</p>
          </div>
          {!navigator.cookieEnabled ? (
            <FormError message="Signing in needs cookies. Turn them on for this site, then reload the page." />
          ) : null}
          {children}
        </section>
      </main>

      {aside}
    </div>
  );
}
