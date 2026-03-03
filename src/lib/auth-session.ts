import { NextRequest } from "next/server";

interface AuthSession {
  access_token?: string;
  id_token?: string;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, "=");
    const payloadJson = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAuthSessionFromRequest(req: NextRequest): AuthSession | null {
  const sessionCookie = req.cookies.get("auth_session")?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie) as AuthSession;
  } catch {
    return null;
  }
}

export function getUserIdFromSession(session: AuthSession | null): string | null {
  if (!session) {
    return null;
  }

  if (typeof session.sub === "string" && session.sub) {
    return session.sub;
  }

  if (typeof session.id_token === "string") {
    const payload = decodeJwtPayload(session.id_token);
    if (payload && typeof payload.sub === "string" && payload.sub) {
      return payload.sub;
    }
  }

  if (typeof session.access_token === "string") {
    return `access-token:${session.access_token.slice(0, 12)}`;
  }

  return null;
}

export function getUserEmailFromSession(session: AuthSession | null): string | null {
  if (!session) {
    return null;
  }

  if (typeof session.email === "string" && session.email) {
    return session.email;
  }

  if (typeof session.id_token === "string") {
    const payload = decodeJwtPayload(session.id_token);
    if (payload && typeof payload.email === "string" && payload.email) {
      return payload.email;
    }
  }

  return null;
}
