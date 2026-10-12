import express from "express";
import type { Request, Response } from "express";
import { prisma } from "./lib/prisma";
import authRouter from "./routes/authRoute";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const app = express();

app.use(express.json({ limit: "1mb" }));

//health route
app.get("/health", async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", db: "ok" });
});

//routes
app.use("/api/v1/auth", authRouter);

// 404 for unknown routes
app.use(notFoundHandler);
// error handler
app.use(errorHandler);
