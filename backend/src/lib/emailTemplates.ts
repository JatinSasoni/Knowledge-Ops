// Escape user-provided text (names, workspace names) before putting it into HTML.
const esc = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/*
 * Every Citely email uses this one layout: heading, a few paragraphs, an optional button.
 * Emails need INLINE styles (many mail apps ignore <style> blocks), and a plain-text
 * version too (some apps show only text, and spam filters like having both).
 */
export function emailLayout(input: {
  heading: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  footnote?: string;
}) {
  const { heading, paragraphs, button, footnote } = input;

  const html = `<!doctype html>
<html><body style="margin:0;background:#ede6d6;font-family:Arial,Helvetica,sans-serif;color:#121612">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbf8f1;border-radius:12px;padding:32px">
        <tr><td>
          <p style="margin:0 0 24px;font-size:20px;font-weight:bold;color:#1f4d3a">Citely</p>
          <h1 style="margin:0 0 16px;font-size:22px">${esc(heading)}</h1>
          ${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${esc(p)}</p>`).join("")}
          ${
            button
              ? `<p style="margin:24px 0"><a href="${esc(button.url)}" style="display:inline-block;background:#1f4d3a;color:#ede6d6;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">${esc(button.label)}</a></p>`
              : ""
          }
          ${footnote ? `<p style="margin:24px 0 0;font-size:13px;color:#5b5a4f">${esc(footnote)}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    heading,
    "",
    ...paragraphs,
    ...(button ? ["", `${button.label}: ${button.url}`] : []),
    ...(footnote ? ["", footnote] : []),
  ].join("\n");

  return { html, text };
}

export const resetPasswordEmail = (link: string) =>
  emailLayout({
    heading: "Reset your password",
    paragraphs: [
      "Someone (hopefully you) asked to reset the password for your Citely account.",
      "The link works once and expires in 30 minutes.",
    ],
    button: { label: "Choose a new password", url: link },
    footnote: "Didn't ask for this? You can ignore this email. Your password won't change.",
  });

export const passwordChangedEmail = () =>
  emailLayout({
    heading: "Your password was changed",
    paragraphs: [
      "The password for your Citely account was just changed, and all devices were signed out.",
      "If this was you, there's nothing else to do.",
    ],
    footnote: "If this wasn't you, reset your password right away and reply to this email.",
  });

export const addedToWorkspaceEmail = (input: {
  inviter: string; // who added them (email)
  workspace: string; // workspace name
  role: "ADMIN" | "MEMBER";
  link: string;
}) =>
  emailLayout({
    heading: `You've been added to ${input.workspace}`,
    paragraphs: [
      `${input.inviter} added you to the "${input.workspace}" workspace on Citely as ${
        input.role === "ADMIN" ? "an admin" : "a member"
      }.`,
      "You can now ask questions about its documents and see the passage behind every answer.",
    ],
    button: { label: "Open workspace", url: input.link },
    footnote:
      "Not expecting this? You can ignore this email, or ask the workspace admin to remove you.",
  });
