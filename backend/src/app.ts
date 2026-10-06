import express from "express";
import type { Request, Response } from "express";
import { prisma } from "./lib/prisma";

export const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", db: "ok" });
});

//routes

// 404 for unknown routes

// error handler
