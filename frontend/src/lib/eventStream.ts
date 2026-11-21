/*
 * Reads a Server-Sent Events response while it is still arriving.
 * Used by the app's chat and by the website widget.
 *
 * The server sends blocks of text separated by a blank line:
 *   event: token
 *   data: {"text":"Hello"}
 *
 * A network chunk can hold several events, or half of one, so we keep a buffer:
 * every complete event (ending in a blank line) is handed to `onEvent`, and the
 * unfinished rest waits for the next chunk.
 */
export type StreamEvent = { name: string; data: ReturnType<typeof JSON.parse> };

export async function readEventStream(
  response: Response,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;

    let end = buffer.indexOf("\n\n");
    while (end !== -1) {
      onEvent(parseEvent(buffer.slice(0, end)));
      buffer = buffer.slice(end + 2);
      end = buffer.indexOf("\n\n");
    }
  }
}

// "event: token\ndata: {...}" → { name: "token", data: {...} }
function parseEvent(block: string): StreamEvent {
  let name = "message";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  return { name, data: data ? JSON.parse(data) : null };
}
