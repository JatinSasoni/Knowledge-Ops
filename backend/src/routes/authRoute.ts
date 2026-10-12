import { Router } from "express";
import { login, me, register } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../schemas/auth";
import { requireAuth } from "../middleware/requireAuth";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.get("/me", requireAuth, me);

export default authRouter;
