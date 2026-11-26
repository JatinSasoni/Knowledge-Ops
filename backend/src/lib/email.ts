import { UnrecoverableError } from "bullmq";
import { Resend } from "resend";
import { env } from "../config/env.js";

import { emailQueue, type EmailJob } from "./queue.js";

const resend = new Resend(env.RESEND_API_KEY);

export async function queueEmail(email: EmailJob) {
  await emailQueue.add("send", email);
}

export async function sendEmailNow(email: EmailJob) {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    replyTo: env.EMAIL_REPLY_TO,
    ...email,
  });

  if (!error) return;
  const status = (error as { statusCode?: number }).statusCode;
  const retryable = !status || status >= 500 || status === 429;
  if (retryable) throw new Error(`Resend: ${error.message}`);
  throw new UnrecoverableError(`Resend: ${error.message}`);
}
