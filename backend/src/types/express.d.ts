import "express";
import type { Role } from "../../generated/prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; email: string };
    membership?: { workspaceId: string; role: Role };
  }
}
