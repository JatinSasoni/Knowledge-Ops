import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";

export type IngestJob = { documentId: string };

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const ingestQueue = new Queue<IngestJob>("ingest", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export type EmailJob = { to: string; subject: string; html: string; text: string };

export const emailQueue = new Queue<EmailJob>("email", {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 10_000 }, // 10s, 20s, 40s, …
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
