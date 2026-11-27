import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  AddMemberSchema,
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
} from "../schemas/workspace.js";
import {
  addMember,
  cancelInvitation,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listInvitations,
  listMembers,
  listMyWorkspaces,
  removeMember,
  updateWorkspace,
} from "../controllers/workspaceController.js";
import { requireMembership } from "../middleware/requireMembership.js";
import documentRouter from "./documentRoute.js";
import { SearchSchema } from "../schemas/search.js";
import { search } from "../controllers/searchController.js";
import { ChatSchema } from "../schemas/chat.js";
import { chat, getMessages, listConversations } from "../controllers/chatController.js";
import { CreateWidgetKeySchema, UpdateWidgetKeySchema } from "../schemas/widgetKey.js";
import {
  createWidgetKey,
  listWidgetKeys,
  revokeWidgetKey,
  updateWidgetKey,
} from "../controllers/widgetKeyController.js";

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

//--- Search Route
workspaceRouter.post("/:workspaceId/search", requireMembership(), validate(SearchSchema), search);

//--- Chat
workspaceRouter.post("/:workspaceId/chat", requireMembership(), validate(ChatSchema), chat);
workspaceRouter.get("/:workspaceId/conversations", requireMembership(), listConversations);
workspaceRouter.get(
  "/:workspaceId/conversations/:conversationId/messages",
  requireMembership(),
  getMessages,
);

//--- Widget Keys ( ADMINS ONLY)

workspaceRouter.get("/:workspaceId/widget-keys", requireMembership("ADMIN"), listWidgetKeys);
workspaceRouter.post(
  "/:workspaceId/widget-keys",
  requireMembership("ADMIN"),
  validate(CreateWidgetKeySchema),
  createWidgetKey,
);
workspaceRouter.patch(
  "/:workspaceId/widget-keys/:keyId",
  requireMembership("ADMIN"),
  validate(UpdateWidgetKeySchema),
  updateWidgetKey,
);
workspaceRouter.delete(
  "/:workspaceId/widget-keys/:keyId",
  requireMembership("ADMIN"),
  revokeWidgetKey,
);
workspaceRouter.get("/:workspaceId/invitations", requireMembership("ADMIN"), listInvitations);
workspaceRouter.delete(
  "/:workspaceId/invitations/:invitationId",
  requireMembership("ADMIN"),
  cancelInvitation,
);

export default workspaceRouter;
