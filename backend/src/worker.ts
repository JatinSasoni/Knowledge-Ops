import { prisma } from "./lib/prisma.js";
import { Worker } from "bullmq";
import { redis, type EmailJob, type IngestJob } from "./lib/queue.js";
import { ingestDocument } from "./ingest/ingestDocument.js";
import { sendEmailNow } from "./lib/email.js";

const worker = new Worker<IngestJob>("ingest", (job) => ingestDocument(job.data.documentId), {
  connection: redis,
  concurrency: 2,
});

const emailWorker = new Worker<EmailJob>("email", (job) => sendEmailNow(job.data), {
  connection: redis,
  concurrency: 5,
});

emailWorker.on("completed", (job) => console.log(`Email ${job.id} sent to ${job.data.to}`));
emailWorker.on("failed", (job, error) =>
  console.log(`Email ${job?.id} attempt ${job?.attemptsMade} failed: ${error.message}`),
);

// After the LAST attempt fails, record a readable reason on the document
worker.on("failed", async (job, error) => {
  if (!job) return;
  const attempts = job.opts.attempts ?? 1;
  const unrecoverable = error.name === "UnrecoverableError";
  console.log(`Job ${job.id} attempt ${job.attemptsMade}/${attempts} failed: ${error.message}`);

  if (job.attemptsMade < attempts && !unrecoverable) return;

  await prisma.document.updateMany({
    where: { id: job.data.documentId },
    data: {
      status: "FAILED",
      error: unrecoverable
        ? error.message
        : "Processing failed after several attempts. Try again in a few minutes.",
    },
  });
});

worker.on("completed", (job) => console.log(`Job ${job.id} done: document ${job.data.documentId}`));

worker.on("ready", () => console.log("Worker ready, waiting for ingest jobs"));

// Docker sends SIGTERM on stop: finish the current job, then exit.
async function shutdown() {
  await Promise.all([worker.close(), emailWorker.close()]);
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
