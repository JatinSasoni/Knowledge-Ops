// The text goes into HTML, so <, >, &, quotes must be escaped (a workspace named
// "<script>…" must show as text, not run as code).

import { findActiveWidget } from "../lib/widget.js";
import { WidgetFrameQuery } from "../schemas/widget.js";
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
