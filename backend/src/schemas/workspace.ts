import { z } from "zod";

const visibility = z.enum(["PRIVATE", "PUBLIC"]);

export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(60),
  visibility: visibility.default("PRIVATE"),
});

export const AddMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const UpdateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    visibility: visibility.optional(),
  })
  .refine((data) => data.name !== undefined || data.visibility !== undefined, {
    message: "Send a name or a visibility to update",
  });

export const memberParams = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid(),
});
export const invitationParams = z.object({ workspaceId: z.uuid(), invitationId: z.uuid() });

export const workspaceParams = z.object({ workspaceId: z.uuid() });

export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof AddMemberSchema>;
