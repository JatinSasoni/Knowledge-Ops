import { AppError } from "../util/AppError.js";
import { prisma } from "../lib/prisma.js";
import { runAgent } from "../lib/agent.js";
import { openEventStream, sendEvent } from "../lib/sse.js";
import { describeToolCall, type Citation } from "../lib/tools.js";
import { countWidgetAnswer, findActiveWidget, widgetAnswersThisMonth } from "../lib/widget.js";
import { WidgetFrameQuery, type WidgetChatInput } from "../schemas/widget.js";

// The text goes into HTML, so <, >, &, quotes must be escaped (a workspace named
// "<script>…" must show as text, not run as code).
import { asyncHandler } from "../util/asyncHandler.js";

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const page = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body>${body}</body>
</html>`;

/*
 * GET /api/v1/widget/frame?key=pk_…
 * The page shown INSIDE the iframe on the customer's site.
 * The important part is the header, not the HTML:
 *   Content-Security-Policy: frame-ancestors https://acme.com …
 * tells the browser "only show this page inside those websites". On any other site the
 * browser refuses to render it, so a copied snippet is useless there.
 */

export const widgetFrame = asyncHandler(async (req, res) => {
  const parsed = WidgetFrameQuery.safeParse(req.query);
  const widget = parsed.success ? await findActiveWidget(parsed.data.key) : null;

  if (!widget) {
    // Same answer for "no such key", "revoked" and "private workspace".
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    res.status(404).type("html").send(page("Citely", "<p>This chat isn't available.</p>"));
    return;
  }

  res.setHeader(
    "Content-Security-Policy",
    `frame-ancestors ${widget.widgetKey.allowedOrigins.join(" ")}`,
  );
  res.setHeader("Cache-Control", "no-store"); // a revoked key must stop working at once

  // The widget app (built in W4) reads its settings from this element.
  const settings = escapeHtml(
    JSON.stringify({ key: widget.widgetKey.key, workspace: widget.workspace.name }),
  );
  res.type("html").send(
    page(
      `${widget.workspace.name} · Citely`,
      `<div id="citely-widget" data-settings="${settings}"></div>
  <script type="module" src="/widget/embed.js"></script>`,
    ),
  );
});

/*
 * POST /api/v1/widget/chat   (public; protected by the widget key + limits)
 * Body: { key, question, history: last ≤6 messages kept by the widget in the browser }
 * Streams the same events as the app's chat, minus "conversation" (nothing is saved per visitor).
 */
export const widgetChat = asyncHandler(async (req, res) => {
  const { key, question, history } = req.body as WidgetChatInput;

  const widget = await findActiveWidget(key);
  if (!widget) throw AppError.notFound("This chat isn't available");
  const { widgetKey, workspace, entitlements } = widget;

  // Monthly cap: checked BEFORE spending money on an answer.
  if ((await widgetAnswersThisMonth(workspace.id)) >= entitlements.monthlyWidgetAnswers) {
    throw new AppError(
      429,
      "This chat has reached its monthly limit. Please contact the website owner.",
      "MONTHLY_LIMIT",
    );
  }

  // "Last used" for the admin's key list. Not awaited: the visitor shouldn't wait for it.
  void prisma.widgetKey
    .update({ where: { id: widgetKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  openEventStream(res);

  const stop = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) stop.abort();
  });

  let answer = "";
  try {
    await runAgent(
      { workspaceId: workspace.id, question, history, signal: stop.signal },
      {
        onToolCall: (name, args) =>
          sendEvent(res, "status", { label: describeToolCall(name, args) }),
        onSources: (sources: Citation[]) => sendEvent(res, "citations", sources),
        onToken: (text) => {
          answer += text;
          sendEvent(res, "token", { text });
        },
      },
    );
  } catch (error) {
    if (!stop.signal.aborted) {
      console.error("[widget] generation failed", error);
      sendEvent(res, "error", { message: "The answer couldn't be generated. Please try again." });
    }
  } finally {
    // Count it if the model produced anything (that's what costs money).
    if (answer) await countWidgetAnswer(workspace.id).catch(() => {});
    if (!res.writableEnded) {
      sendEvent(res, "done", {});
      res.end();
    }
  }
});
