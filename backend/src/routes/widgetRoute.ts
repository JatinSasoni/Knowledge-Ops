import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { widgetKeyLimit, widgetVisitorLimit } from "../middleware/rateLimits.js";
import { widgetChat, widgetFrame } from "../controllers/widgetController.js";
import { WidgetChatSchema } from "../schemas/widget.js";

// PUBLIC routes: no login. Every handler checks the widget key itself.
const widgetRouter = Router();

widgetRouter.get("/frame", widgetFrame);
widgetRouter.post(
  "/chat",
  widgetVisitorLimit, // 1. per IP, before anything else
  validate(WidgetChatSchema), // 2. body shape
  widgetKeyLimit, // 3. per key (needs the validated key)
  widgetChat,
);

export default widgetRouter;
