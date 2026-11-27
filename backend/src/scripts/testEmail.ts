import { queueEmail } from "../lib/email.js";
import { emailLayout } from "../lib/emailTemplates.js";

const to = process.argv[2];
if (!to) throw new Error("Usage: npx tsx src/scripts/testEmail.ts you@example.com");

await queueEmail({
  to,
  subject: "Citely test email",
  ...emailLayout({
    heading: "It works!",
    paragraphs: ["This email went API → queue → worker → Resend → your inbox."],
    button: { label: "Open Citely", url: "http://localhost:5173" },
    footnote: "You're getting this because you're testing Citely.",
  }),
});
console.log(`Queued an email to ${to}. Watch the worker terminal.`);
process.exit(0);
