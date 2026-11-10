import express from "express";
import type { Request, Response } from "express";
import { prisma } from "./lib/prisma.js";
import authRouter from "./routes/authRoute.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/requireAuth.js";
import workspaceRouter from "./routes/workspaceRoute.js";

export const app = express();

app.use(express.json({ limit: "1mb" }));

//health route
app.get("/health", async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", db: "ok" });
});

//routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/workspaces", requireAuth, workspaceRouter);

// 404 for unknown routes
app.use(notFoundHandler);
// error handler
app.use(errorHandler);
