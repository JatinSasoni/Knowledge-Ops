import { env } from "../config/env.js";
import { buildMessages, MAX_ANSWER_TOKENS, type HistoryMessage } from "./chat.js";
import { openai } from "./openai.js";
import { runTool, SourceList, TOOLS, type Citation } from "./tools.js";

// At most 3 rounds of tool calls, then the model must answer with what it has.
// Stops a confused model from searching forever (and spending money doing it).
const MAX_TOOL_ROUNDS = 3;

export type AgentEvents = {
  onToken?: (text: string) => void; // a piece of the answer
  onToolCall?: (name: string, args: string) => void; // a tool is about to run
  onToolResult?: (name: string, args: string, result: string) => void; // what the tool returned
  onSources?: (sources: Citation[]) => void; // the source list grew
};

type ToolCall = { id: string; name: string; args: string };

/*
 * The loop
 * 1. Send the conversation + tool list to the model (streamed).
 * 2. If it writes text → that's the answer, stream it out. Done.
 * 3. If it asks for tools → run them, add their results to the conversation, go to 1.
 */
export async function runAgent(
  input: { workspaceId: string; question: string; history: HistoryMessage[]; signal?: AbortSignal },
  events: AgentEvents = {},
) {
  const sources = new SourceList();
  const messages = buildMessages(input.question, input.history);
  let answer = "";

  for (let round = 0; ; round++) {
    const stream = await openai.chat.completions.create(
      {
        model: env.CHAT_MODEL,
        messages,
        tools: TOOLS,
        tool_choice: round < MAX_TOOL_ROUNDS ? "auto" : "none", // last round: answer, no more tools
        stream: true,
        max_completion_tokens: MAX_ANSWER_TOKENS,
      },
      { signal: input.signal },
    );

    // A streamed tool call arrives in fragments (name first, then the JSON
    // arguments a few characters at a time), so we glue the pieces together.
    const calls: ToolCall[] = [];
    let roundText = "";

    for await (const part of stream) {
      const delta = part.choices[0]?.delta;
      if (delta?.content) {
        roundText += delta.content;
        events.onToken?.(delta.content);
      }
      for (const fragment of delta?.tool_calls ?? []) {
        const call = (calls[fragment.index] ??= { id: "", name: "", args: "" });
        if (fragment.id) call.id = fragment.id;
        if (fragment.function?.name) call.name += fragment.function.name;
        if (fragment.function?.arguments) call.args += fragment.function.arguments;
      }
    }
    answer += roundText;

    if (calls.length === 0) break; // no tools requested: the answer is complete

    // Record what the model asked for, then add one "tool" message per result.
    // The model needs both to understand the results on the next round.
    messages.push({
      role: "assistant",
      content: roundText || null,
      tool_calls: calls.map((c) => ({
        id: c.id,
        type: "function" as const,
        function: { name: c.name, arguments: c.args },
      })),
    });
    for (const call of calls) {
      events.onToolCall?.(call.name, call.args);
      const result = await runTool(call.name, call.args, {
        workspaceId: input.workspaceId,
        sources,
      });
      events.onToolResult?.(call.name, call.args, result);
      messages.push({ role: "tool", tool_call_id: call.id, content: result });
    }
    events.onSources?.(sources.all);
  }

  return { answer, sources: sources.all };
}
