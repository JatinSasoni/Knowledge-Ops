import type { WorkspaceVisibility } from "../generated/prisma/client.js";

/*
 * What a workspace is allowed to do: the ONE place that answers this.
 * Every feature check (can it have a widget? how many answers per month?) calls this
 * function instead of checking fields directly.
 *
 * Today: fixed defaults, based only on visibility.
 * Later (payments): read the workspace's plan/subscription here, e.g.
 *   no paid plan → widget: false, monthlyWidgetAnswers: 0
 * and nothing else in the codebase has to change.
 */

export type Entitlements = {
  widget: boolean; // may create widget keys and answer website visitors
  monthlyWidgetAnswers: number; // cap on widget answers per calendar month
};

export function getEntitlements(workspace: { visibility: WorkspaceVisibility }): Entitlements {
  const isPublic = workspace.visibility === "PUBLIC";
  return {
    widget: isPublic,
    monthlyWidgetAnswers: isPublic ? 500 : 0,
  };
}
