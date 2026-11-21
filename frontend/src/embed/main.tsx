import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// ?inline: the CSS comes in as a string, so the whole widget is ONE file (embed.js).
import css from "./embed.css?inline";
import { WidgetApp, type WidgetSettings } from "./WidgetApp";

const style = document.createElement("style");
style.textContent = css;
document.head.append(style);

const font = document.createElement("link");
font.rel = "stylesheet";
font.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap";
document.head.append(font);

// The frame page (from the API) puts the key and workspace name on this element.
const root = document.getElementById("citely-widget");
if (root?.dataset.settings) {
  const settings = JSON.parse(root.dataset.settings) as WidgetSettings;
  createRoot(root).render(
    <StrictMode>
      <WidgetApp settings={settings} />
    </StrictMode>,
  );
}
