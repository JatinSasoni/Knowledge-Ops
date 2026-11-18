import { embedText } from "./embeddings.js";
import { prisma } from "./prisma.js";

export type RetrievedPassage = {
  id: string;
  documentId: string;
  documentTitle: string;
  index: number;
  content: string;
  similarity: number;
};

export async function searchPassages(workspaceId: string, query: string, limit: number) {
  const vector = JSON.stringify(await embedText(query));

  return prisma.$queryRaw<RetrievedPassage[]>`
    SELECT c."id", c."documentId", d."title" AS "documentTitle", c."index", c."content",
           1 - (c."embedding" <=> ${vector}::vector) AS "similarity"
    FROM "DocumentChunk" c
    JOIN "Document" d ON d."id" = c."documentId"
    WHERE c."workspaceId" = ${workspaceId}
      AND c."embedding" IS NOT NULL
    ORDER BY c."embedding" <=> ${vector}::vector
    LIMIT ${limit}
  `;
}
