import { UnrecoverableError } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { downloadFile } from "../lib/storage.js";
import { chunkText } from "./chunk.js";
import { cleanText, readDocumentText } from "./extract.js";

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

  // All or nothing: old passages out, new ones in, status READY.
  // A retried job replaces the passages instead of adding duplicates.
  await prisma.$transaction([
    prisma.documentChunk.deleteMany({ where: { documentId } }),
    prisma.documentChunk.createMany({
      data: chunks.map((chunk) => ({ ...chunk, documentId, workspaceId: document.workspaceId })),
    }),
    prisma.document.updateMany({
      where: { id: documentId },
      data: { status: "READY", error: null },
    }),
  ]);
}
