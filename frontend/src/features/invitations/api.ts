import { http } from "../../lib/api";
import type { InvitationPreview } from "../../types";

/*
 * The invite link's token is kept in sessionStorage while the person signs up or signs
 * in (those pages are separate routes), then used once on the invite page.
 * sessionStorage: survives navigation and reloads in this tab, gone when the tab closes.
 */
const STORAGE_KEY = "citely:invite-token";

export const pendingInvite = {
  get: () => {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null; // storage blocked (e.g. strict privacy mode)
    }
  },
  set: (token: string) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, token);
    } catch {
      /* the invite still works within this page */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing stored */
    }
  },
};

// Public: who invited you, to which workspace. The token goes in the body, not the URL,
// so it never lands in server or proxy logs.
export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const response = await http.post<{ invitation: InvitationPreview }>("/invitations/preview", {
    token,
  });
  return response.data.invitation;
}

// Signed in: join the workspace. Returns its id so the page can open it.
export async function acceptInvitation(token: string): Promise<string> {
  const response = await http.post<{ workspaceId: string }>("/invitations/accept", { token });
  return response.data.workspaceId;
}
