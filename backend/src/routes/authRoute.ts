import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
} from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../schemas/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { forgotPasswordEmailLimit, forgotPasswordIpLimit } from "../middleware/rateLimits.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);

authRouter.get("/me", requireAuth, me);
authRouter.post(
  "/forgot-password",
  forgotPasswordIpLimit,
  validate(forgotPasswordSchema),
  forgotPasswordEmailLimit, // per address (needs the validated email)
  forgotPassword,
);
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default authRouter;
