import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export type GoogleProfile = { googleId: string; email: string; name: string | null };

export async function verifyGoogleToken(idToken: string): Promise<GoogleProfile | null> {
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) return null;
    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name ?? null,
    };
  } catch {
    return null;
  }
}
