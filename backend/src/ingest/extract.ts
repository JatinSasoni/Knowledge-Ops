import { UnrecoverableError } from "bullmq";
import { extractText, getDocumentProxy } from "unpdf";

export async function readDocumentText(file: Buffer, mimeType: string | null): Promise<string> {
  if (mimeType === "text/plain" || mimeType === "text/markdown") {
    return file.toString("utf8");
  }

  if (mimeType === "application/pdf") {
    return readPdf(file);
  }
  throw new UnrecoverableError(`Files of type ${mimeType ?? "unknown"} can't be read`);
}

async function readPdf(file: Buffer): Promise<string> {
  let pdf;
  try {
    pdf = await getDocumentProxy(new Uint8Array(file));
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException") {
      throw new UnrecoverableError(
        "This PDF is password-protected. Remove the password and upload it again.",
      );
    }
    throw new UnrecoverableError("This file couldn't be opened as a PDF. It may be damaged.");
  }
  try {
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  } finally {
    await pdf.loadingTask.destroy();
  }
}

export function cleanText(text: string): string {
  return text
    .replaceAll("\u0000", "") // Postgres refuses text containing NUL characters
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/\r\n/g, "\n") // Windows line endings → \n
    .replace(/[ \t]+/g, " ") // runs of spaces → one space
    .replace(/\n{3,}/g, "\n\n") // keep paragraphs, drop big gaps
    .trim();
}
