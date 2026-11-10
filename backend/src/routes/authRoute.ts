import { Router } from "express";
import { login, me, register } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.get("/me", requireAuth, me);

export default authRouter;
