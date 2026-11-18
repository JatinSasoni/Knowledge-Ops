import OpenAI from "openai";
import { env } from "../config/env.js";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 60_000,
});

const BATCH_SIZE = 100;

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  if (!vector) throw new Error("No embedding returned");
  return vector;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const response = await openai.embeddings.create({ model: env.EMBEDDING_MODEL, input: batch });

    // Each result says which input it belongs to; sort so order is guaranteed.
    const inOrder = [...response.data].sort((a, b) => a.index - b.index);
    vectors.push(...inOrder.map((item) => item.embedding));
  }

  return vectors;
}
