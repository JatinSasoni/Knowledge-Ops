import { getEncoding } from "js-tiktoken";

const encoding = getEncoding("cl100k_base");

export type Chunk = { index: number; content: string; tokenCount: number };

export function chunkText(text: string, size = 500, overlap = 50): Chunk[] {
  const tokens = encoding.encode(text);
  const step = size - overlap;
  const chunks: Chunk[] = [];

  for (let start = 0; start < tokens.length; start += step) {
    const window = tokens.slice(start, start + size);
    chunks.push({
      index: chunks.length,
      content: encoding.decode(window),
      tokenCount: window.length,
    });
    if (start + size >= tokens.length) break;
  }

  return chunks;
}
