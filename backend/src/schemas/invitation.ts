import { z } from "zod";
export const InvitationTokenSchema = z.object({ token: z.string().min(20).max(200) });
export type InvitationTokenInput = z.infer<typeof InvitationTokenSchema>;
