import axios from "axios";
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

export async function deleteDocument(workspaceId: string, documentId: string): Promise<void> {
  await http.delete(`/workspaces/${workspaceId}/documents/${documentId}`);
}

/* ---------- Uploading a file: three requests ---------- */

type UploadTicket = { document: DocumentRecord; uploadUrl: string };

// 1. Ask our API for permission: it creates the document and returns a presigned upload URL.
export async function requestUpload(
  workspaceId: string,
  file: { name: string; mimeType: string; size: number },
): Promise<UploadTicket> {
  const response = await http.post<UploadTicket>(
    `/workspaces/${workspaceId}/documents/upload-url`,
    {
      fileName: file.name,
      mimeType: file.mimeType,
      size: file.size,
    },
  );
  return response.data;
}

// 2. Send the file straight to storage using that URL.
//    Plain axios, NOT our `http` client: the URL itself is the permission, and our
//    client would attach the user's access token, which must never go to the storage server.
export async function uploadToStorage(
  uploadUrl: string,
  file: File,
  mimeType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": mimeType },
    onUploadProgress: (event) => {
      if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
}

// 3. Tell our API the file is there, so it can start processing it.
export async function processDocument(workspaceId: string, documentId: string): Promise<void> {
  await http.post(`/workspaces/${workspaceId}/documents/${documentId}/process`);
}
