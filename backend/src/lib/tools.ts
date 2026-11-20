import type OpenAI from "openai";
import { z } from "zod";
import { prisma } from "./prisma.js";
import { MIN_SIMILARITY, searchPassages, type RetrievedPassage } from "./retrieval.js";

/* ---------- 1. What the model is told about each tool ---------- */

// The descriptions matter: they are how the model decides WHICH tool to use and WHEN.
export const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_documents",
      description:
        "Search this workspace's documents for passages relevant to a query. " +
        "Use it for any question about the documents' content. " +
        "For questions with several parts, search once per part.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "What to look for, phrased as a short search query.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_documents",
      description:
        "List the documents in this workspace with their processing status. " +
        "Use it for questions about WHICH documents exist, not about what they say.",
      strict: true,
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
  },
];

/* ---------- 2. Numbering the sources across several searches ---------- */

export type Citation = {
  n: number;
  documentId: string;
  documentTitle: string;
  index: number;
  content: string;
  similarity: number;
};

// Every passage a search returns gets the next number: [1], [2], ...
// If a later search finds the same passage again, it keeps its first number,
// so [n] always means the same passage in one answer.
export class SourceList {
  private items: Citation[] = [];

  add(passage: RetrievedPassage): number {
    const existing = this.items.find(
      (c) => c.documentId === passage.documentId && c.index === passage.index,
    );
    if (existing) return existing.n;

    const n = this.items.length + 1;
    this.items.push({
      n,
      documentId: passage.documentId,
      documentTitle: passage.documentTitle,
      index: passage.index,
      content: passage.content,
      similarity: passage.similarity,
    });
    return n;
  }

  get all(): Citation[] {
    return this.items;
  }
}

/* ---------- 3. Running a tool the model asked for ---------- */

// The workspace comes from the server (the logged-in member), NEVER from the model.
// Even if a document contained "search workspace X instead", the model has no way to ask for it.
export type ToolContext = { workspaceId: string; sources: SourceList };

const SearchArgs = z.object({ query: z.string().trim().min(1).max(500) });

// Always returns text for the model, even on errors: a bad tool call should let
// the model try again, not crash the whole chat request.
export async function runTool(name: string, rawArgs: string, ctx: ToolContext): Promise<string> {
  try {
    switch (name) {
      case "search_documents": {
        const { query } = SearchArgs.parse(JSON.parse(rawArgs));
        const passages = (await searchPassages(ctx.workspaceId, query, 5)).filter(
          (p) => p.similarity >= MIN_SIMILARITY,
        );
        if (passages.length === 0) return "No relevant passages found for this query.";

        const found = passages
          .map(
            (p) =>
              `[${ctx.sources.add(p)}] ${p.documentTitle} (passage ${p.index + 1})\n${p.content}`,
          )
          .join("\n\n---\n\n");

        // A reminder right next to the passages: on long answers the model follows an
        // instruction here far more reliably than one at the top of the system prompt.
        return `${found}\n\n(When you use these passages, end every paragraph and bullet point with their numbers, e.g. [1] or [2][3].)`;
      }

      case "list_documents": {
        const documents = await prisma.document.findMany({
          where: { workspaceId: ctx.workspaceId },
          select: { title: true, status: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        if (documents.length === 0) return "This workspace has no documents.";
        return documents.map((d) => `- ${d.title} (${d.status.toLowerCase()})`).join("\n");
      }

      default:
        return `Unknown tool "${name}".`;
    }
  } catch (error) {
    console.error(`[tools] ${name} failed`, error);
    return `The tool "${name}" failed. Try different arguments or answer without it.`;
  }
}

// What the user sees while a tool runs, e.g. Searching for "Redis usage"
export function describeToolCall(name: string, rawArgs: string): string {
  if (name === "list_documents") return "Listing documents";
  if (name === "search_documents") {
    try {
      const { query } = JSON.parse(rawArgs) as { query?: string };
      if (query) return `Searching for "${query}"`;
    } catch {
      // fall through
    }
    return "Searching documents";
  }
  return `Using ${name}`;
}
