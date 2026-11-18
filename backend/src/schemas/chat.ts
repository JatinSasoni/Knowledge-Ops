import { z } from "zod";

export const ChatSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  conversationId: z.uuid().optional(), // missing = start a new conversation
});

export const conversationParams = z.object({
  workspaceId: z.uuid(),
  conversationId: z.uuid(),
});

export type ChatInput = z.infer<typeof ChatSchema>;
