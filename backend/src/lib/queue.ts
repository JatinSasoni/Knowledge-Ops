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
