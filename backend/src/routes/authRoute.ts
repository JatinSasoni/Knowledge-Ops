import { Router } from "express";
import { login, me, register } from "../controllers/authController";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", me);

export default authRouter;
