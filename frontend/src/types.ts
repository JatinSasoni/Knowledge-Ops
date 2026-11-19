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

export type Workspace = {
  id: string;
  name: string;
  slug: string;
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
