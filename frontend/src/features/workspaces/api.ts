import { http } from "../../lib/api";
import type { Invitation, Member, Role, Visibility, Workspace, WorkspaceDetail } from "../../types";

/* ---------- Workspaces ---------- */

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await http.get<{ workspaces: Workspace[] }>("/workspaces");
  return response.data.workspaces;
}

export async function getWorkspace(id: string): Promise<WorkspaceDetail> {
  const response = await http.get<{ workspace: WorkspaceDetail }>(`/workspaces/${id}`);
  return response.data.workspace;
}

export async function createWorkspace(input: {
  name: string;
  visibility: Visibility;
}): Promise<Workspace> {
  const response = await http.post<{ workspace: Workspace }>("/workspaces", input);
  return response.data.workspace;
}

// Rename and/or change visibility: send only the fields that change.
export async function updateWorkspace(
  id: string,
  changes: { name?: string; visibility?: Visibility },
): Promise<Workspace> {
  const response = await http.patch<{ workspace: Workspace }>(`/workspaces/${id}`, changes);
  return response.data.workspace;
}

export async function deleteWorkspace(id: string): Promise<void> {
  await http.delete(`/workspaces/${id}`);
}

/* ---------- Members ---------- */

export async function getMembers(workspaceId: string): Promise<Member[]> {
  const response = await http.get<{ members: Member[] }>(`/workspaces/${workspaceId}/members`);
  return response.data.members;
}

// Adding someone has two outcomes: they already have an account (added right away),
// or they don't (the server emails them an invitation instead).
export type AddMemberResult =
  { kind: "added"; member: Member } | { kind: "invited"; invitation: Invitation };

export async function addMember(
  workspaceId: string,
  email: string,
  role: Role,
): Promise<AddMemberResult> {
  const response = await http.post<{ member?: Member; invitation?: Invitation }>(
    `/workspaces/${workspaceId}/members`,
    { email, role },
  );
  if (response.data.invitation) return { kind: "invited", invitation: response.data.invitation };
  return { kind: "added", member: response.data.member! };
}

export async function getInvitations(workspaceId: string): Promise<Invitation[]> {
  const response = await http.get<{ invitations: Invitation[] }>(
    `/workspaces/${workspaceId}/invitations`,
  );
  return response.data.invitations;
}

export async function cancelInvitation(workspaceId: string, invitationId: string): Promise<void> {
  await http.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
}

export async function removeMember(workspaceId: string, userId: string): Promise<void> {
  await http.delete(`/workspaces/${workspaceId}/members/${userId}`);
}
