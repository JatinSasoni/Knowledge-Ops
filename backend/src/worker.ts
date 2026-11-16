import { prisma } from "./lib/prisma.js";
import { setTimeout as sleep } from "node:timers/promises";
import { Worker } from "bullmq";
import { redis, type IngestJob } from "./lib/queue.js";

async function ingest(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) return;

  //   await sleep(2000);
  await sleep(2000);

  await prisma.document.updateMany({
    where: { id: documentId },
    data: { status: "READY" },
  });
}

const worker = new Worker<IngestJob>("ingest", (job) => ingest(job.data.documentId), {
  connection: redis,
  concurrency: 2, // handle two documents at a time
});

// After the LAST attempt fails, record a readable reason on the document
worker.on("failed", async (job, error) => {
  if (!job) return;
  const attempts = job.opts.attempts ?? 1;
  console.log(`Job ${job.id} attempt ${job.attemptsMade}/${attempts} failed: ${error.message}`);

  if (job.attemptsMade < attempts) return; // bullmq retries it

  await prisma.document.updateMany({
    where: { id: job.data.documentId },
    data: { status: "FAILED", error: error.message.slice(0, 500) },
  });
});

worker.on("completed", (job) => console.log(`Job ${job.id} done: document ${job.data.documentId}`));

worker.on("ready", () => console.log("Worker ready, waiting for ingest jobs"));

// Docker sends SIGTERM on stop: finish the current job, then exit.
async function shutdown() {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
