import bcrypt from "bcryptjs";
import { asyncHandler } from "../util/asyncHandler";
import { prisma } from "../lib/prisma";
import { AppError } from "../util/AppError";
import { signToken } from "../lib/jwt";

const publicUser = (u: { id: string; email: string; createdAt: Date }) => ({
  id: u.id,
  email: u.email,
  createdAt: u.createdAt,
});

export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
    },
  });

  res.status(201).json({ id: user.id, email: user.email });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const token = signToken({ sub: user.id, email: user.email });
  res.json({ user: publicUser(user), token });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw AppError.unauthorized("User no longer exists");
  res.json({ user: publicUser(user) });
});
