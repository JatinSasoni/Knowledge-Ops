import { ApiError, http, refreshSession, session } from "../../lib/api";
import { readEventStream } from "../../lib/eventStream";
import type { ChatMessage, Citation, ConversationSummary } from "../../types";

/* ---------- Normal requests: axios, like the rest of the app ---------- */

export async function getConversations(workspaceId: string): Promise<ConversationSummary[]> {
  const response = await http.get<{ conversations: ConversationSummary[] }>(
    `/workspaces/${workspaceId}/conversations`,
  );
  return response.data.conversations;
}

export async function getMessages(
  workspaceId: string,
  conversationId: string,
): Promise<ChatMessage[]> {
  const response = await http.get<{ messages: ChatMessage[] }>(
    `/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
  );
  return response.data.messages;
}

/* ---------- Asking a question: a streamed answer ---------- */

/*
 * Why fetch and not axios here?
 * In the browser, axios only hands you the response once it has fully arrived.
 * fetch gives you `response.body`, a stream we can read piece by piece while the
 * server is still writing, so the answer appears word by word.
 *
 * The server sends Server-Sent Events: blocks of text separated by a blank line.
 *
 *   event: token
 *   data: {"text":"Hello"}
 *
 * Events, in order: conversation → (status, citations)* → token (many) → done.
 * "status" says which tool the model is using (e.g. Searching for "Redis"); it can
 * come several times, and "citations" is re-sent each time the source list grows.
 * If generation fails, an "error" event comes instead of more tokens.
 */

export type StreamHandlers = {
  onConversation: (conversation: { id: string; title: string }) => void;
  onStatus: (label: string) => void;
  onCitations: (citations: Citation[]) => void;
  onToken: (text: string) => void;
};

export async function streamChat(
  workspaceId: string,
  body: { question: string; conversationId?: string },
  handlers: StreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  const response = await postChat(workspaceId, body, signal);
  let finished = false;

  // The buffering and splitting into events lives in lib/eventStream (shared with the widget).
  await readEventStream(response, (event) => {
    if (event.name === "conversation") handlers.onConversation(event.data);
    if (event.name === "status") handlers.onStatus(event.data.label);
    if (event.name === "citations") handlers.onCitations(event.data);
    if (event.name === "token") handlers.onToken(event.data.text);
    if (event.name === "error") throw new ApiError(500, "GENERATION_FAILED", event.data.message);
    if (event.name === "done") finished = true;
  });

  // The connection closed before "done": the server crashed or the network dropped.
  if (!finished) {
    throw new ApiError(0, "NETWORK", "The answer was cut off. Please try again.");
  }
}

// Sends the question. fetch doesn't go through our axios interceptors, so the
// two things they do for us are done by hand: attach the token, and on a 401
// refresh the session once and try again.
async function postChat(
  workspaceId: string,
  body: { question: string; conversationId?: string },
  signal: AbortSignal,
): Promise<Response> {
  const send = () =>
    fetch(`/api/v1/workspaces/${workspaceId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.get() ?? ""}`,
      },
      body: JSON.stringify(body),
      credentials: "include",
      signal,
    });

  try {
    let response = await send();
    if (response.status === 401) {
      await refreshSession(); // throws if the session is really over
      response = await send();
    }
    if (!response.ok) throw await errorFrom(response);
    return response;
  } catch (error) {
    if (error instanceof ApiError || signal.aborted) throw error;
    // fetch throws a plain TypeError when the server can't be reached.
    throw new ApiError(0, "NETWORK", "Can't reach the server. Check your connection.");
  }
}

// Before streaming starts, errors are normal JSON: { error: { code, message, details } }
async function errorFrom(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  return new ApiError(
    response.status,
    body?.error?.code ?? "UNKNOWN",
    body?.error?.message ?? "Something went wrong",
    body?.error?.details,
  );
}
