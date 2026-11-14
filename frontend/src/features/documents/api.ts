import { http } from "../../lib/api";
import type { DocumentRecord, Page } from "../../types";

export const PAGE_SIZE = 10;

export async function getDocuments(
  workspaceId: string,
  page: number,
  search: string,
): Promise<Page<DocumentRecord>> {
  const response = await http.get<Page<DocumentRecord>>(`/workspaces/${workspaceId}/documents`, {
    params: {
      page,
      limit: PAGE_SIZE,
      // The API rejects an empty search, so only send it when there is one.
      search: search || undefined,
    },
  });
  return response.data;
}

export async function createDocument(workspaceId: string, title: string): Promise<DocumentRecord> {
  const response = await http.post<{ document: DocumentRecord }>(
    `/workspaces/${workspaceId}/documents`,
    { title },
  );
  return response.data.document;
}

export async function deleteDocument(workspaceId: string, documentId: string): Promise<void> {
  await http.delete(`/workspaces/${workspaceId}/documents/${documentId}`);
}
