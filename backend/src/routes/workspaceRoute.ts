import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  AddMemberSchema,
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
} from "../schemas/workspace.js";
import {
  addMember,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listMembers,
  listMyWorkspaces,
  removeMember,
  updateWorkspace,
} from "../controllers/workspaceController.js";
import { requireMembership } from "../middleware/requireMembership.js";
import documentRouter from "./documentRoute.js";

const workspaceRouter = Router();

workspaceRouter.post("/", validate(CreateWorkspaceSchema), createWorkspace);
workspaceRouter.get("/", listMyWorkspaces);
workspaceRouter.get("/:workspaceId", requireMembership(), getWorkspace);
workspaceRouter.get("/:workspaceId/members", requireMembership(), listMembers);
workspaceRouter.post(
  "/:workspaceId/members",
  requireMembership("ADMIN"),
  validate(AddMemberSchema),
  addMember,
);
workspaceRouter.patch(
  "/:workspaceId",
  requireMembership("ADMIN"),
  validate(UpdateWorkspaceSchema),
  updateWorkspace,
);
workspaceRouter.delete("/:workspaceId", requireMembership("ADMIN"), deleteWorkspace);
workspaceRouter.delete("/:workspaceId/members/:userId", requireMembership("ADMIN"), removeMember);
//--- Document Route
workspaceRouter.use("/:workspaceId/documents", requireMembership(), documentRouter);

export default workspaceRouter;
