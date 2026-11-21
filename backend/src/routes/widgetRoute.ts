import { Router } from "express";
import { widgetFrame } from "../controllers/widgetController.js";

// PUBLIC routes: no login. Every handler checks the widget key itself.
const widgetRouter = Router();

widgetRouter.get("/frame", widgetFrame);

export default widgetRouter;
