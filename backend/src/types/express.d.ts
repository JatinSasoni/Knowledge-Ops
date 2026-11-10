import "express";
import type { Role } from "../generated/prisma/client.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; email: string };
    membership?: { workspaceId: string; role: Role };
  }
}
