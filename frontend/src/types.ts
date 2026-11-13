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
