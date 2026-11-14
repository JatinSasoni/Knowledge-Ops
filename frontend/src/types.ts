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

export type DocumentRecord = {
  id: string;
  title: string;
  fileUrl: string | null;
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
