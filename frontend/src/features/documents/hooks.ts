import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keys } from "../workspaces/hooks";
import * as documentsApi from "./api";

export function useDocuments(workspaceId: string, page: number, search: string) {
  return useQuery({
    queryKey: [...keys.documents(workspaceId), page, search],
    queryFn: () => documentsApi.getDocuments(workspaceId, page, search),
    // While the next page loads, keep showing the current one (no empty flash).
    placeholderData: keepPreviousData,
  });
}

export function useCreateDocument(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => documentsApi.createDocument(workspaceId, title),
    onSuccess: () => {
      // Refreshes the workspace (document count) and every documents page under it.
      queryClient.invalidateQueries({ queryKey: keys.workspace(workspaceId) });
    },
  });
}

export function useDeleteDocument(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.deleteDocument(workspaceId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.workspace(workspaceId) });
    },
  });
}
