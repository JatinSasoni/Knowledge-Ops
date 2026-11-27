import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role, Visibility } from "../../types";
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
  invitations: (id: string) => ["workspace", id, "invitations"],
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
    mutationFn: (name: string) => workspacesApi.updateWorkspace(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.workspace(id) });
      queryClient.invalidateQueries({ queryKey: keys.workspaces });
    },
  });
}

export function useChangeVisibility(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visibility: Visibility) => workspacesApi.updateWorkspace(id, { visibility }),
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
      // Refreshes the workspace (member count) and, because they share the prefix,
      // the members and pending invitations lists too.
      queryClient.invalidateQueries({ queryKey: keys.workspace(workspaceId) });
    },
  });
}

/* ---------- Invitations (people without an account yet) ---------- */

export function useInvitations(workspaceId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.invitations(workspaceId),
    queryFn: () => workspacesApi.getInvitations(workspaceId),
    enabled, // admins only
  });
}

export function useCancelInvitation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => workspacesApi.cancelInvitation(workspaceId, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.invitations(workspaceId) }),
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
