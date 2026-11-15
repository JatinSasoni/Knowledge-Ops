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

export const ALLOWED_TYPES = ["application/pdf", "text/markdown", "text/plain"] as const;
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

export const UploadUrlSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.enum(ALLOWED_TYPES),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
});

export type CreateDocumentsInput = z.infer<typeof CreateDocumentSchema>;
export type ListDocumentsQueryInput = z.infer<typeof ListDocumentQuery>;
export type UploadUrlInput = z.infer<typeof UploadUrlSchema>;
