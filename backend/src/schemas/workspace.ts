import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(60),
});

export const AddMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("ADMIN"),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof AddMemberSchema>;
