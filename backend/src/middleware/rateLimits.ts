import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { redis } from "../lib/queue.js";

/*
 * The counters live in Redis, not in the API's memory, so:
 *  - every API container shares the same counts (2 containers ≠ double the limit)
 *  - a restart doesn't reset them
 */
const redisStore = (prefix: string) =>
  new RedisStore({
    prefix,
    sendCommand: (command: string, ...args: string[]) =>
      redis.call(command, ...args) as Promise<RedisReply>,
  });

// Same error shape as the rest of the API: { error: { code, message } }
const tooMany = (_req: Request, res: Response) => {
  res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: "Too many questions. Please wait a moment and try again.",
    },
  });
};

// One visitor (by IP): 10 questions a minute.
export const widgetVisitorLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-7", // tells clients how long to wait (RateLimit headers)
  legacyHeaders: false,
  store: redisStore("rl:widget:ip:"),
  handler: tooMany,
});

// One widget key, all visitors together: 60 questions a minute.
// Stops a single website (or someone abusing its key from many IPs) from flooding us.
export const widgetKeyLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: redisStore("rl:widget:key:"),
  keyGenerator: (req) => (req.body as { key: string }).key, // runs after validate(), so key exists
  handler: tooMany,
});
