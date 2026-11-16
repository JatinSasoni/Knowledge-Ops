import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keys } from "../workspaces/hooks";
import * as documentsApi from "./api";

export function useDocuments(workspaceId: string, page: number, search: string) {
  return useQuery({
    queryKey: [...keys.documents(workspaceId), page, search],
    queryFn: () => documentsApi.getDocuments(workspaceId, page, search),
    // While the next page loads, keep showing the current one (no empty flash).
    placeholderData: keepPreviousData,
    // Live status: while any document on this page is being processed, check again every
    // 2.5 seconds. Once none are, polling stops by itself (false = don't refetch).
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const anyProcessing = items.some((document) => document.status === "PROCESSING");
      return anyProcessing ? 2500 : false;
    },
  });
}

export function useDeleteDocument(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.deleteDocument(workspaceId, documentId),
    onSuccess: () => {
      // Refreshes the workspace (document count) and every documents page under it.
      queryClient.invalidateQueries({ queryKey: keys.workspace(workspaceId) });
    },
  });
}

type UploadInput = {
  file: File;
  mimeType: string;
  onStep: (step: string) => void;
  onProgress: (percent: number) => void;
};

// The whole upload in one mutation: ask for a URL, upload the file, start processing.
export function useUploadDocument(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, mimeType, onStep, onProgress }: UploadInput) => {
      onStep("Preparing…");
      const { document, uploadUrl } = await documentsApi.requestUpload(workspaceId, {
        name: file.name,
        mimeType,
        size: file.size,
      });

      onStep("Uploading…");
      await documentsApi.uploadToStorage(uploadUrl, file, mimeType, onProgress);

      onStep("Starting processing…");
      await documentsApi.processDocument(workspaceId, document.id);
      return document;
    },
    // Refresh the list either way: even a failed upload may have created a document row.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.workspace(workspaceId) });
    },
  });
}

// Retry a failed document: the same "process" endpoint moves it from FAILED back to PROCESSING.
export function useRetryDocument(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.processDocument(workspaceId, documentId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.documents(workspaceId) });
    },
  });
}
