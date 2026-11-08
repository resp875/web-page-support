import { NextRequest } from "next/server";
import { SignJWT, decodeJwt, jwtVerify } from "jose";

// セッションは AUTH0_SECRET で HS256 署名した JWT を HttpOnly Cookie に保存する。
// 以前は Auth0 のトークンを平文 JSON で保存し、id_token の中身を検証せずに信用していたため、
// Cookie を細工すれば任意のユーザーになりすませた。

export const SESSION_COOKIE_NAME = "auth_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const SESSION_ALG = "HS256";
const MIN_SECRET_LENGTH = 32;

export interface SessionUser {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

function pickUser(claims: Record<string, unknown>): SessionUser | null {
  if (typeof claims.sub !== "string" || claims.sub === "") {
    return null;
  }
  const user: SessionUser = { sub: claims.sub };
  for (const key of ["email", "name", "picture"] as const) {
    const value = claims[key];
    if (typeof value === "string" && value !== "") {
      user[key] = value;
    }
  }
  return user;
}

function secretKey(secret: string | undefined): Uint8Array | null {
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

/**
 * Auth0 の token エンドポイントから TLS で直接受け取った id_token からユーザー情報を取り出す。
 * この経路では OIDC Core 3.1.3.7 により署名検証を TLS のサーバー検証で代替できるため、
 * aud / iss / exp のみ確認する。Cookie など利用者が送ってくる値には使わないこと。
 */
export function userFromIdToken(
  idToken: unknown,
  expected: { clientId: string; issuer: string },
  nowSeconds: number = Math.floor(Date.now() / 1000),
): SessionUser | null {
  if (typeof idToken !== "string" || idToken === "") {
    return null;
  }
  let claims: Record<string, unknown>;
  try {
    claims = decodeJwt(idToken);
  } catch {
    return null;
  }

  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(expected.clientId)) {
    return null;
  }
  if (claims.iss !== expected.issuer) {
    return null;
  }
  if (typeof claims.exp !== "number" || claims.exp <= nowSeconds) {
    return null;
  }
  return pickUser(claims);
}

/** セッショントークンを作成する。secret が不正なら例外 */
export async function createSessionToken(
  user: SessionUser,
  secret: string | undefined,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  const key = secretKey(secret);
  if (!key) {
    throw new Error(`AUTH0_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: SESSION_ALG })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + SESSION_MAX_AGE_SECONDS)
    .sign(key);
}

/** セッショントークンの署名と有効期限を検証する。不正なら null */
export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<SessionUser | null> {
  const key = secretKey(secret);
  if (!token || !key) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: [SESSION_ALG] });
    return pickUser(payload);
  } catch {
    return null;
  }
}

/** リクエストの Cookie から検証済みのログインユーザーを取り出す */
export function getSessionUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value, process.env.AUTH0_SECRET);
}
