import { Router } from "express";
import { acceptInvitation, previewInvitation } from "../controllers/invitationController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { InvitationTokenSchema } from "../schemas/invitation.js";

const invitationRouter = Router();

invitationRouter.post("/preview", validate(InvitationTokenSchema), previewInvitation);
invitationRouter.post("/accept", requireAuth, validate(InvitationTokenSchema), acceptInvitation);

export default invitationRouter;
