import { z } from "zod";

export const CreateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const ListDocumentQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().min(1).max(100).optional(),
});

export const docParams = z.object({
  workspaceId: z.uuid(),
  docId: z.uuid(),
});

export type CreateDocumentsInput = z.infer<typeof CreateDocumentSchema>;
export type ListDocumentsQueryInput = z.infer<typeof ListDocumentQuery>;
