import { readFile } from "node:fs/promises";
import { prisma } from "../lib/prisma.js";
import { MIN_SIMILARITY, searchPassages, type RetrievedPassage } from "../lib/retrieval.js";

type Case =
  | { question: string; document: string; contains: string; expectNone?: false }
  | { question: string; expectNone: true };

const TOP_K = 5;

// Is this passage the one the case is looking for?
function isMatch(passage: RetrievedPassage, c: Extract<Case, { document: string }>) {
  return (
    passage.documentTitle.toLowerCase().includes(c.document.toLowerCase()) &&
    passage.content.toLowerCase().includes(c.contains.toLowerCase())
  );
}

async function main() {
  const workspaceId = process.argv[2];
  if (!workspaceId) throw new Error("Usage: npm run eval:retrieval -- <workspaceId>");

  const cases: Case[] = JSON.parse(await readFile("eval/retrieval.json", "utf8"));

  let answerable = 0;
  let hitAt1 = 0;
  let hitAtK = 0;
  let reciprocalRankSum = 0;
  let negatives = 0;
  let negativesPassed = 0;

  for (const c of cases) {
    // Same filter as the chat: only passages above the threshold count.
    const results = (await searchPassages(workspaceId, c.question, TOP_K)).filter(
      (p) => p.similarity >= MIN_SIMILARITY,
    );
    const top = results[0]?.similarity.toFixed(3) ?? "-";

    if (c.expectNone) {
      negatives++;
      const passed = results.length === 0;
      if (passed) negativesPassed++;
      console.log(`${passed ? "PASS" : "FAIL"}  [none]  top=${top}  ${c.question}`);
      continue;
    }

    answerable++;
    const rank = results.findIndex((p) => isMatch(p, c)) + 1; // 0 = not found
    if (rank === 1) hitAt1++;
    if (rank > 0) {
      hitAtK++;
      reciprocalRankSum += 1 / rank;
    }
    console.log(`${rank > 0 ? "PASS" : "FAIL"}  rank=${rank || "-"}  top=${top}  ${c.question}`);
  }

  const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(0)}%` : "-");
  console.log(`
Answerable questions: ${answerable}
  Hit@1   ${pct(hitAt1, answerable)}   (right passage ranked first)
  Hit@${TOP_K}   ${pct(hitAtK, answerable)}   (right passage anywhere in the top ${TOP_K})
  MRR     ${(answerable ? reciprocalRankSum / answerable : 0).toFixed(2)}   (1.00 = always first)
Unanswerable questions: ${negatives}
  Correctly empty  ${pct(negativesPassed, negatives)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
