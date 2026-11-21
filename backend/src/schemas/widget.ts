import { z } from "zod";

const key = z.string().trim().startsWith("pk_").max(100);

export const WidgetFrameQuery = z.object({ key });

export const WidgetChatSchema = z.object({
  key,
  question: z.string().trim().min(1).max(1000),
  // Visitors aren't logged in, so the widget sends its own recent messages.
  history: z
    .array(
      z.object({
        role: z.enum(["USER", "ASSISTANT"]),
        content: z.string().max(4000),
      }),
    )
    .max(6)
    .default([]),
});

export type WidgetChatInput = z.infer<typeof WidgetChatSchema>;
