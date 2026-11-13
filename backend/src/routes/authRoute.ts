import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);

authRouter.get("/me", requireAuth, me);

export default authRouter;
