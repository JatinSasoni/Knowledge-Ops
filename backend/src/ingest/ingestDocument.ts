import { UnrecoverableError } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { downloadFile } from "../lib/storage.js";
import { chunkText } from "./chunk.js";
import { cleanText, readDocumentText } from "./extract.js";
import { embedTexts } from "../lib/embeddings.js";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";

export async function ingestDocument(documentId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document || !document.fileKey) return;

  const file = await downloadFile(document.fileKey);
  const text = cleanText(await readDocumentText(file, document.mimeType));

  if (text.length < 20) {
    throw new UnrecoverableError(
      document.mimeType === "application/pdf"
        ? "This PDF has no selectable text. It may be a scan; upload a version with real text."
        : "This file has no text to read.",
    );
  }

  const chunks = chunkText(text);
  let vectors;
  try {
    vectors = await embedTexts(chunks.map((chunk) => chunk.content));
  } catch (error) {
    if (error instanceof OpenAI.APIError && error.status === 401) {
      throw new UnrecoverableError(
        "Processing isn't set up correctly. Ask an admin to check the AI settings.",
      );
    }
    throw error;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.documentChunk.deleteMany({ where: { documentId } });

      for (const [i, chunk] of chunks.entries()) {
        const vector = JSON.stringify(vectors[i]); // pgvector reads the text form "[0.01,-0.02,...]"
        await tx.$executeRaw`
          INSERT INTO "DocumentChunk" ("id", "documentId", "workspaceId", "index", "content", "tokenCount", "embedding")
          VALUES (${randomUUID()}, ${documentId}, ${document.workspaceId}, ${chunk.index},
                  ${chunk.content}, ${chunk.tokenCount}, ${vector}::vector)
        `;
      }

      await tx.document.updateMany({
        where: { id: documentId },
        data: { status: "READY", error: null },
      });
    },
    { timeout: 60_000 }, // the default 5s is too short for many inserts
  );
}
