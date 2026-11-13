import type { CSSProperties } from "react";

export const wrap = "mx-auto w-full max-w-[1320px] px-5 md:px-10";
export const sectionY = "py-20 lg:py-28";
export const h2Big =
  "font-display text-[clamp(40px,5.4vw,80px)] font-extrabold leading-[0.98] tracking-[-0.035em]";
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export const PENDING_WORKSPACE_KEY = "pendingWorkspaceName";
