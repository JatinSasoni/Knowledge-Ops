// src/config/env.ts
import "dotenv/config"; // loads .env into process.env, must run before parsing
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(3, "JWT_SECRET must be at least 3 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(z.prettifyError(parsed.error));
  process.exit(1); // refuse to start with bad config
}

export const env = parsed.data; // fully typed: env.PORT is a number
