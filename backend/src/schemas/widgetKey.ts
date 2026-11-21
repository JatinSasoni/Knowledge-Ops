import { z } from "zod";

/*
 * One allowed website, normalised to its origin: "https://acme.com/help/" → "https://acme.com".
 * Only https (plus http://localhost for testing), because the widget will run on real sites.
 */
const origin = z
  .string()
  .trim()
  .transform((value, ctx) => {
    try {
      const url = new URL(value);
      const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
        ctx.addIssue({
          code: "custom",
          message: "Use an https:// address (http only for localhost)",
        });
        return z.NEVER;
      }
      return url.origin;
    } catch {
      ctx.addIssue({ code: "custom", message: "Not a valid web address" });
      return z.NEVER;
    }
  });

const allowedOrigins = z
  .array(origin)
  .min(1, "Add at least one website")
  .max(10)
  .transform((list) => [...new Set(list)]); // drop duplicates

export const CreateWidgetKeySchema = z.object({
  name: z.string().trim().min(1).max(60),
  allowedOrigins,
});

export const UpdateWidgetKeySchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    allowedOrigins: allowedOrigins.optional(),
  })
  .refine((d) => d.name !== undefined || d.allowedOrigins !== undefined, {
    message: "Send a name or allowed websites to update",
  });

export const widgetKeyParams = z.object({ workspaceId: z.uuid(), keyId: z.uuid() });

export type CreateWidgetKeyInput = z.infer<typeof CreateWidgetKeySchema>;
export type UpdateWidgetKeyInput = z.infer<typeof UpdateWidgetKeySchema>;
