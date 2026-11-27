// Shapes returned by the API. Dates arrive as ISO strings (JSON has no Date type).

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
};

export type Role = "ADMIN" | "MEMBER";

// PRIVATE: only members can ask. PUBLIC: members + website visitors (through the widget).
export type Visibility = "PRIVATE" | "PUBLIC";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  visibility: Visibility;
  createdAt: string;
  role: Role; // the signed-in user's role in this workspace
};

export type WorkspaceDetail = Workspace & {
  _count: { members: number; documents: number };
};

export type Member = {
  id: string;
  role: Role;
  createdAt?: string;
  user: { id: string; email: string };
};

export type DocumentStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export type DocumentRecord = {
  id: string;
  title: string;
  fileKey: string | null;
  mimeType: string | null;
  size: number | null; // bytes
  status: DocumentStatus;
  error: string | null; // readable reason when status is FAILED
  workspaceId: string;
  createdAt: string;
};

export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/* ---------- Chat ---------- */

// One source passage the answer can point to with [n].
export type Citation = {
  n: number;
  documentId: string;
  documentTitle: string;
  index: number; // passage number inside the document (0-based)
  content: string;
  similarity: number; // 0..1, how close the passage is to the question
};

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: Citation[] | null; // only on assistant messages
  createdAt: string;
};

/* ---------- Widget ---------- */

// A public key for the website widget of a PUBLIC workspace.
export type WidgetKey = {
  id: string;
  name: string;
  key: string; // "pk_…": public, it goes into the website's HTML
  allowedOrigins: string[]; // websites allowed to show the widget
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

/* ---------- Invitations ---------- */

// A pending invite for someone who doesn't have an account yet (admins see these).
export type Invitation = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
};

// What the invite page shows before the person signs in.
export type InvitationPreview = {
  email: string;
  role: Role;
  workspaceName: string;
  invitedBy: string;
};
