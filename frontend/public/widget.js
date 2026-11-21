/*
 * Citely website widget loader.
 * Customers add one line to their site:
 *   <script src="https://YOUR-CITELY-DOMAIN/widget.js" data-key="pk_…" async></script>
 *
 * This file runs on THEIR page, so it is plain JavaScript (no framework), touches nothing
 * but its own two elements, and uses inline styles so the site's CSS can't break it.
 * The chat itself lives in an iframe served by Citely, isolated from the site.
 */
(function () {
  var script = document.currentScript;
  if (!script || window.__citelyWidget) return; // pasted twice? only one bubble
  window.__citelyWidget = true;

  var key = script.getAttribute("data-key");
  if (!key) {
    console.warn("[Citely] widget.js needs a data-key attribute.");
    return;
  }
  // Wherever this script was loaded from is the Citely server.
  var citely = new URL(script.src).origin;
  var PINE = "#1f4d3a";

  // The Citely mark (golden document on green), loaded from the Citely server.
  var CHAT_ICON =
    '<img src="' +
    citely +
    '/apple-touch-icon.png" alt="" width="56" height="56" style="display:block;width:100%;height:100%;border-radius:50%;object-fit:cover">';
  var CLOSE_ICON =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function css(element, styles) {
    for (var name in styles) element.style.setProperty(name, styles[name]);
  }

  /* ---------- The bubble ---------- */
  var button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Open chat");
  button.innerHTML = CHAT_ICON;
  css(button, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    width: "56px",
    height: "56px",
    "border-radius": "50%",
    border: "0",
    padding: "0",
    overflow: "hidden",
    background: PINE,
    color: "#ede6d6",
    display: "flex",
    "align-items": "center",
    "justify-content": "center",
    cursor: "pointer",
    "box-shadow": "0 10px 30px -8px rgba(0,0,0,.45)",
    "z-index": "2147483647",
    transition: "transform .15s ease",
  });
  button.addEventListener("mouseenter", function () {
    button.style.transform = "scale(1.06)";
  });
  button.addEventListener("mouseleave", function () {
    button.style.transform = "";
  });

  /* ---------- The chat window (iframe), created on first open ---------- */
  var frame = null;
  var open = false;

  function createFrame() {
    frame = document.createElement("iframe");
    frame.title = "Chat";
    frame.src = citely + "/api/v1/widget/frame?key=" + encodeURIComponent(key);
    css(frame, {
      position: "fixed",
      right: "20px",
      bottom: "88px",
      width: "380px",
      height: "580px",
      "max-width": "calc(100vw - 24px)",
      "max-height": "calc(100vh - 110px)",
      border: "0",
      "border-radius": "16px",
      background: "#fbf8f1",
      "box-shadow": "0 24px 60px -12px rgba(0,0,0,.4)",
      "z-index": "2147483647",
      display: "none",
    });
    document.body.appendChild(frame);
  }

  function setOpen(next) {
    open = next;
    if (open && !frame) createFrame(); // load the chat only when someone wants it
    frame.style.display = open ? "block" : "none";
    button.innerHTML = open ? CLOSE_ICON : CHAT_ICON;
    button.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    button.setAttribute("aria-expanded", String(open));
    if (open) frame.focus();
  }

  button.addEventListener("click", function () {
    setOpen(!open);
  });

  // The chat's own close button / Escape key sends { type: "citely:close" }.
  // Accept it only from OUR iframe, served by the Citely server.
  window.addEventListener("message", function (event) {
    if (!frame || event.source !== frame.contentWindow || event.origin !== citely) return;
    if (event.data && event.data.type === "citely:close") {
      setOpen(false);
      button.focus();
    }
  });

  function mount() {
    document.body.appendChild(button);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
