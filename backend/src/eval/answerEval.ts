import { readFile } from "node:fs/promises";
import { env } from "../config/env.js";
import { buildPrompt, MAX_ANSWER_TOKENS, NOT_FOUND } from "../lib/chat.js";
import { openai } from "../lib/openai.js";
import { prisma } from "../lib/prisma.js";
import { MIN_SIMILARITY, searchPassages, type RetrievedPassage } from "../lib/retrieval.js";

type Case = { question: string; facts: string[] } | { question: string; expectNotFound: true };

// The judge can be a different (stronger) model than the one answering.
const JUDGE_MODEL = process.env.JUDGE_MODEL ?? env.CHAT_MODEL;

/* ---------- 1. Answer the question exactly like the chat does (just not streamed) ---------- */

async function answer(workspaceId: string, question: string) {
  const passages = (await searchPassages(workspaceId, question, 5)).filter(
    (p) => p.similarity >= MIN_SIMILARITY,
  );
  if (passages.length === 0) return { passages, text: NOT_FOUND };

  const completion = await openai.chat.completions.create({
    model: env.CHAT_MODEL,
    messages: buildPrompt(question, passages, []),
    max_completion_tokens: MAX_ANSWER_TOKENS,
  });
  return { passages, text: completion.choices[0]?.message.content ?? "" };
}

/* ---------- 2. Citations: checked by code, no AI needed ---------- */

// At least one [n], and every [n] points to a source that exists.
function citationsValid(text: string, sourceCount: number) {
  const numbers = [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  return numbers.length > 0 && numbers.every((n) => n >= 1 && n <= sourceCount);
}

/* ---------- 3. The judge: a second model call that grades the answer ---------- */

const JUDGE_PROMPT = `You grade one answer from an assistant that must answer ONLY from the given sources.
Return:
- refused: true if the answer says it couldn't find the information instead of answering.
- factsFound: true if the answer states every expected fact (same meaning is enough; wording may differ). True if there are no expected facts.
- grounded: true if every claim in the answer is supported by the sources. A refusal counts as grounded.
- reason: one short sentence explaining any false value (empty if all good).
Be strict about "grounded": one claim that is not in the sources makes it false.`;

type Verdict = { refused: boolean; factsFound: boolean; grounded: boolean; reason: string };

async function judge(
  question: string,
  facts: string[],
  passages: RetrievedPassage[],
  text: string,
): Promise<Verdict> {
  const sources = passages.map((p, i) => `[${i + 1}] ${p.content}`).join("\n\n");
  const expected = facts.length
    ? facts.map((f) => `- ${f}`).join("\n")
    : "(none: the documents do not contain this answer)";

  const completion = await openai.chat.completions.create({
    model: JUDGE_MODEL,
    temperature: 0, // same input → same grade, so runs are comparable
    messages: [
      { role: "system", content: JUDGE_PROMPT },
      {
        role: "user",
        content: `Question:\n${question}\n\nExpected facts:\n${expected}\n\nSources:\n${sources || "(none)"}\n\nAnswer to grade:\n${text}`,
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
  const score = { answerable: 0, correct: 0, grounded: 0, cited: 0, unanswerable: 0, refused: 0 };

  for (const c of cases) {
    const { passages, text } = await answer(workspaceId, c.question);
    const facts = "facts" in c ? c.facts : [];
    const verdict = await judge(c.question, facts, passages, text);
    if (verdict.grounded) score.grounded++;

    let passed: boolean;
    if ("expectNotFound" in c) {
      score.unanswerable++;
      passed = verdict.refused && verdict.grounded;
      if (passed) score.refused++;
    } else {
      score.answerable++;
      const cited = citationsValid(text, passages.length);
      if (verdict.factsFound) score.correct++;
      if (cited) score.cited++;
      passed = verdict.factsFound && verdict.grounded && cited;
    }

    console.log(`${passed ? "PASS" : "FAIL"}  ${c.question}`);
    if (!passed) {
      console.log(`      answer: ${text.replace(/\s+/g, " ").slice(0, 200)}`);
      console.log(`      judge:  ${verdict.reason}`);
    }
  }

  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "-");
  console.log(`
Answerable: ${score.answerable}
  Correct    ${pct(score.correct, score.answerable)}   (states the expected facts)
  Cited      ${pct(score.cited, score.answerable)}   (has valid [n] citations)
Unanswerable: ${score.unanswerable}
  Refused    ${pct(score.refused, score.unanswerable)}   (said "not found" instead of guessing)
All questions: ${cases.length}
  Grounded   ${pct(score.grounded, cases.length)}   (nothing made up)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
