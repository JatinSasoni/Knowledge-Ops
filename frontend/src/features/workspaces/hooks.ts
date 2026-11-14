import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role } from "../../types";
import * as workspacesApi from "./api";

/*
 * Query keys are the names of cached data. After a change (create, rename, delete...)
 * we "invalidate" the affected keys, which makes React Query fetch them again.
 */
export const keys = {
  workspaces: ["workspaces"],
  workspace: (id: string) => ["workspace", id],
  members: (id: string) => ["workspace", id, "members"],
  documents: (id: string) => ["workspace", id, "documents"],
};

/* ---------- Workspaces ---------- */

export function useWorkspaces() {
  return useQuery({
    queryKey: keys.workspaces,
    queryFn: workspacesApi.getWorkspaces,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: keys.workspace(id),
    queryFn: () => workspacesApi.getWorkspace(id),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workspacesApi.createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.workspaces });
    },
  });
}

export function useRenameWorkspace(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => workspacesApi.renameWorkspace(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.workspace(id) });
      queryClient.invalidateQueries({ queryKey: keys.workspaces });
    },
  });
}

export function useDeleteWorkspace(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => workspacesApi.deleteWorkspace(id),
    onSuccess: () => {
      // The workspace is gone: drop everything cached about it, refresh the list.
      queryClient.removeQueries({ queryKey: keys.workspace(id) });
      queryClient.invalidateQueries({ queryKey: keys.workspaces });
    },
  });
}

/* ---------- Members ---------- */

export function useMembers(workspaceId: string) {
  return useQuery({
    queryKey: keys.members(workspaceId),
    queryFn: () => workspacesApi.getMembers(workspaceId),
  });
}

export function useAddMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: Role }) =>
      workspacesApi.addMember(workspaceId, input.email, input.role),
    onSuccess: () => {
      // Refreshes the workspace (member count) and, because it shares the prefix, members too.
      queryClient.invalidateQueries({ queryKey: keys.workspace(workspaceId) });
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => workspacesApi.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.workspace(workspaceId) });
    },
  });
}
