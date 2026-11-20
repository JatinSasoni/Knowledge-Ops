import { readFile } from "node:fs/promises";
import { env } from "../config/env.js";
import { runAgent } from "../lib/agent.js";
import type { HistoryMessage } from "../lib/chat.js";
import { openai } from "../lib/openai.js";
import { prisma } from "../lib/prisma.js";

/*
 * One test case (eval/answers.json). Only "question" is required.
 *   facts           what a correct answer must say
 *   expectNotFound  the documents don't contain the answer: it must say so, not guess
 *   history         earlier messages, for follow-up questions like "which of those…"
 *   needsCitations  false for answers that don't come from passages ("Hi", the document list)
 *   expectTools     tools that must be used; [] means "no tools at all"
 */
type Case = {
  question: string;
  facts?: string[];
  expectNotFound?: boolean;
  history?: HistoryMessage[];
  needsCitations?: boolean;
  expectTools?: string[];
};

// The judge can be a different (stronger) model than the one answering.
const JUDGE_MODEL = process.env.JUDGE_MODEL ?? env.CHAT_MODEL;

/* ---------- 1. Answer exactly like the chat does (same agent, just not streamed) ---------- */

async function answer(workspaceId: string, c: Case) {
  const toolsUsed: string[] = [];
  const toolResults: string[] = [];

  const { answer, sources } = await runAgent(
    { workspaceId, question: c.question, history: c.history ?? [] },
    {
      // Remember which tools ran and what they returned: the judge checks the answer
      // against exactly what the model saw (passages AND the document list).
      onToolResult: (name, _args, result) => {
        toolsUsed.push(name);
        toolResults.push(`(${name})\n${result}`);
      },
    },
  );
  return {
    text: answer,
    sourceCount: sources.length,
    toolsUsed,
    evidence: toolResults.join("\n\n"),
  };
}

/* ---------- 2. Checks done by code (no AI needed) ---------- */

// Returns what's wrong with the citations, or null if they're fine.
function citationProblem(text: string, sourceCount: number): string | null {
  const numbers = [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  if (numbers.length === 0) return "no citations";
  if (numbers.some((n) => n < 1 || n > sourceCount)) return "cites a source that doesn't exist";

  // Every paragraph and bullet needs its own citation (not one pile at the end).
  // Short lines and intro lines ending in ":" are skipped; one uncited line is tolerated.
  const longLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 60 && !line.endsWith(":") && !line.startsWith("#"));
  const uncited = longLines.filter((line) => !/\[\d+\]/.test(line));
  if (uncited.length > 1) return `${uncited.length} paragraphs/bullets have no citation`;

  return null;
}

// Returns what's wrong with the tool use, or null if it matches the case.
function toolProblem(expected: string[] | undefined, used: string[]): string | null {
  if (!expected) return null;
  if (expected.length === 0) {
    return used.length === 0 ? null : `should use no tools, used: ${used.join(", ")}`;
  }
  const missing = expected.filter((tool) => !used.includes(tool));
  return missing.length === 0 ? null : `didn't use: ${missing.join(", ")}`;
}

/* ---------- 3. The judge: a second model call that grades the answer ---------- */

const JUDGE_PROMPT = `You grade one answer from an assistant that must answer ONLY from its tool results.
Return:
- refused: true if the answer says the requested information is not in the documents. It still counts as refused if it also mentions related facts that ARE in the tool results.
- factsFound: true if the answer states every expected fact (same meaning is enough; wording may differ). True if there are no expected facts.
- grounded: true if every factual claim in the answer is supported by the tool results. Greetings and refusals count as grounded.
- reason: one short sentence explaining any false value (empty if all good).
Be strict about "grounded": one claim that is not in the tool results makes it false.`;

type Verdict = { refused: boolean; factsFound: boolean; grounded: boolean; reason: string };

async function judge(c: Case, evidence: string, text: string): Promise<Verdict> {
  const history = (c.history ?? []).map((m) => `${m.role}: ${m.content}`).join("\n");
  const expected = c.facts?.length
    ? c.facts.map((f) => `- ${f}`).join("\n")
    : c.expectNotFound
      ? "(none: the documents do not contain this answer)"
      : "(none)";

  const completion = await openai.chat.completions.create({
    model: JUDGE_MODEL,
    temperature: 0, // same input → same grade, so runs are comparable
    messages: [
      { role: "system", content: JUDGE_PROMPT },
      {
        role: "user",
        content:
          (history ? `Earlier conversation:\n${history}\n\n` : "") +
          `Question:\n${c.question}\n\nExpected facts:\n${expected}\n\n` +
          `Tool results:\n${evidence || "(no tools were used)"}\n\nAnswer to grade:\n${text}`,
      },
    ],
    // Structured output: the reply is forced to be JSON in exactly this shape.
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "verdict",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["refused", "factsFound", "grounded", "reason"],
          properties: {
            refused: { type: "boolean" },
            factsFound: { type: "boolean" },
            grounded: { type: "boolean" },
            reason: { type: "string" },
          },
        },
      },
    },
  });
  return JSON.parse(completion.choices[0]?.message.content ?? "{}") as Verdict;
}

/* ---------- 4. Run every case and add up the scores ---------- */

async function main() {
  const workspaceId = process.argv[2];
  if (!workspaceId) throw new Error("Usage: npm run eval:answers -- <workspaceId>");

  const cases: Case[] = JSON.parse(await readFile("eval/answers.json", "utf8"));
  const count = { answerable: 0, correct: 0, needCitations: 0, cited: 0 };
  const more = { unanswerable: 0, refused: 0, toolCases: 0, toolsOk: 0, grounded: 0, passed: 0 };

  for (const c of cases) {
    const { text, sourceCount, toolsUsed, evidence } = await answer(workspaceId, c);
    const verdict = await judge(c, evidence, text);
    const problems: string[] = [];

    if (verdict.grounded) more.grounded++;
    else problems.push("not grounded");

    const tools = toolProblem(c.expectTools, toolsUsed);
    if (c.expectTools) {
      more.toolCases++;
      if (tools) problems.push(tools);
      else more.toolsOk++;
    }

    if (c.expectNotFound) {
      more.unanswerable++;
      if (verdict.refused) more.refused++;
      else problems.push("should have said it's not in the documents");
    } else {
      count.answerable++;
      if (verdict.factsFound) count.correct++;
      else problems.push("missing expected facts");

      if (c.needsCitations !== false) {
        count.needCitations++;
        const citations = citationProblem(text, sourceCount);
        if (citations) problems.push(citations);
        else count.cited++;
      }
    }

    const passed = problems.length === 0;
    if (passed) more.passed++;
    console.log(
      `${passed ? "PASS" : "FAIL"}  ${c.question}   [tools: ${toolsUsed.join(", ") || "none"}]`,
    );
    if (!passed) {
      console.log(`      problems: ${problems.join("; ")}`);
      console.log(`      answer:   ${text.replace(/\s+/g, " ").slice(0, 300)}`);
      if (verdict.reason) console.log(`      judge:    ${verdict.reason}`);
    }
  }

  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "-");
  console.log(`
Passed: ${more.passed} / ${cases.length}

Answerable: ${count.answerable}
  Correct    ${pct(count.correct, count.answerable)}   (states the expected facts)
  Cited      ${pct(count.cited, count.needCitations)}   (valid [n] in every paragraph; ${count.needCitations} cases need them)
Unanswerable: ${more.unanswerable}
  Refused    ${pct(more.refused, more.unanswerable)}   (said "not found" instead of guessing)
Tool use: ${more.toolCases} cases
  Right tools ${pct(more.toolsOk, more.toolCases)}
All questions: ${cases.length}
  Grounded   ${pct(more.grounded, cases.length)}   (nothing made up)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
