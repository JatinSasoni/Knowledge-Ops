import { z } from "zod";

export const SearchSchema = z.object({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(10).default(5),
});

export type SearchInput = z.infer<typeof SearchSchema>;
