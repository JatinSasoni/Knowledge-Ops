import { readEventStream } from "../lib/eventStream";
import type { Citation } from "../types";

export type WidgetMessage = { role: "USER" | "ASSISTANT"; content: string };

export type WidgetHandlers = {
  onStatus: (label: string) => void;
  onCitations: (citations: Citation[]) => void;
  onToken: (text: string) => void;
};

// Errors the visitor should see in plain words.
export class WidgetError extends Error {}

/*
 * Ask one question. The iframe page is served from the Citely server, so this is a
 * same-origin request: no login, no cookies, no CORS. The widget key is the only credential.
 * Visitors aren't logged in, so the widget sends its own last few messages for context.
 */
export async function askWidget(
  key: string,
  question: string,
  history: WidgetMessage[],
  handlers: WidgetHandlers,
  signal: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/v1/widget/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, question, history: history.slice(-6) }),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new WidgetError("Can't reach the server. Check your connection.");
  }

  // Before streaming starts, problems come back as normal JSON errors.
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const code = body?.error?.code;
    if (code === "RATE_LIMITED")
      throw new WidgetError("You're asking quickly! Please wait a moment.");
    if (code === "MONTHLY_LIMIT") throw new WidgetError(body.error.message);
    if (response.status === 404) throw new WidgetError("This chat isn't available right now.");
    throw new WidgetError("Something went wrong. Please try again.");
  }

  let finished = false;
  await readEventStream(response, (event) => {
    if (event.name === "status") handlers.onStatus(event.data.label);
    if (event.name === "citations") handlers.onCitations(event.data);
    if (event.name === "token") handlers.onToken(event.data.text);
    if (event.name === "error") throw new WidgetError(event.data.message);
    if (event.name === "done") finished = true;
  });
  if (!finished) throw new WidgetError("The answer was cut off. Please try again.");
}
