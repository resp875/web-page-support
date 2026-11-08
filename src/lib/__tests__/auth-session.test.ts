import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getSessionUserFromRequest,
  userFromIdToken,
  verifySessionToken,
} from "../auth-session";

const SECRET = "0123456789abcdef0123456789abcdef"; // 32文字
const OTHER_SECRET = "fedcba9876543210fedcba9876543210";
const CLIENT_ID = "client-123";
const ISSUER = "https://tenant.us.auth0.com/";
const NOW = 1_800_000_000;

/** ID トークン相当の JWT(署名部分は検証しないのでダミー) */
function makeIdToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
}

const validClaims = {
  sub: "auth0|abc",
  email: "user@example.com",
  name: "User Name",
  picture: "https://example.com/p.png",
  aud: CLIENT_ID,
  iss: ISSUER,
  exp: NOW + 3600,
};

describe("userFromIdToken", () => {
  const expected = { clientId: CLIENT_ID, issuer: ISSUER };

  it("aud / iss / exp が正しければユーザー情報を返す", () => {
    expect(userFromIdToken(makeIdToken(validClaims), expected, NOW)).toEqual({
      sub: "auth0|abc",
      email: "user@example.com",
      name: "User Name",
      picture: "https://example.com/p.png",
    });
  });

  it("aud が配列でも client_id を含めば受け付ける", () => {
    const token = makeIdToken({ ...validClaims, aud: ["other", CLIENT_ID] });
    expect(userFromIdToken(token, expected, NOW)?.sub).toBe("auth0|abc");
  });

  it("email などが無ければ sub だけ返す", () => {
    const token = makeIdToken({ sub: "auth0|only", aud: CLIENT_ID, iss: ISSUER, exp: NOW + 60 });
    expect(userFromIdToken(token, expected, NOW)).toEqual({ sub: "auth0|only" });
  });

  it.each([
    ["aud が違う", { aud: "other-client" }],
    ["iss が違う", { iss: "https://evil.example.com/" }],
    ["期限切れ", { exp: NOW - 1 }],
    ["exp が無い", { exp: undefined }],
    ["sub が空", { sub: "" }],
  ])("%s場合は null", (_label, override) => {
    expect(userFromIdToken(makeIdToken({ ...validClaims, ...override }), expected, NOW)).toBeNull();
  });

  it.each([undefined, "", "not-a-jwt", "a.!!!.c"])("不正な形式 (%s) は null", (token) => {
    expect(userFromIdToken(token, expected, NOW)).toBeNull();
  });
});

describe("createSessionToken / verifySessionToken", () => {
  const user = { sub: "auth0|abc", email: "user@example.com", name: "User Name" };

  it("作成したトークンを同じ secret で検証するとユーザー情報が戻る", async () => {
    const token = await createSessionToken(user, SECRET);
    expect(await verifySessionToken(token, SECRET)).toEqual(user);
  });

  it("別の secret では検証に失敗する", async () => {
    const token = await createSessionToken(user, SECRET);
    expect(await verifySessionToken(token, OTHER_SECRET)).toBeNull();
  });

  it("payload を書き換えると検証に失敗する(なりすまし防止)", async () => {
    const token = await createSessionToken(user, SECRET);
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: "auth0|victim", email: "victim@example.com", exp: NOW * 2 }),
    ).toString("base64url");
    expect(await verifySessionToken(`${header}.${forgedPayload}.${signature}`, SECRET)).toBeNull();
  });

  it("署名なし (alg: none) のトークンは受け付けない", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "auth0|victim", exp: NOW * 2 })).toString("base64url");
    expect(await verifySessionToken(`${header}.${payload}.`, SECRET)).toBeNull();
  });

  it("旧形式の平文 JSON Cookie は受け付けない", async () => {
    const legacy = JSON.stringify({ sub: "auth0|victim", id_token: makeIdToken({ sub: "auth0|victim" }) });
    expect(await verifySessionToken(legacy, SECRET)).toBeNull();
  });

  it("有効期限 (SESSION_MAX_AGE_SECONDS) を過ぎたトークンは受け付けない", async () => {
    const issuedLongAgo = Math.floor(Date.now() / 1000) - SESSION_MAX_AGE_SECONDS - 10;
    const token = await createSessionToken(user, SECRET, issuedLongAgo);
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("有効期限内なら受け付ける", async () => {
    const issuedRecently = Math.floor(Date.now() / 1000) - SESSION_MAX_AGE_SECONDS + 60;
    const token = await createSessionToken(user, SECRET, issuedRecently);
    expect(await verifySessionToken(token, SECRET)).toEqual(user);
  });

  it("sub の無いトークンは同じ secret で署名されていても受け付けない", async () => {
    const token = await new SignJWT({ email: "x@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("secret が 32 文字未満なら作成時にエラー", async () => {
    await expect(createSessionToken(user, "short")).rejects.toThrow(/AUTH0_SECRET/);
  });

  it.each([undefined, "", "short"])("secret が不正 (%s) なら検証は null", async (secret) => {
    const token = await createSessionToken(user, SECRET);
    expect(await verifySessionToken(token, secret)).toBeNull();
  });

  it("トークンが無ければ null", async () => {
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
  });
});

describe("getSessionUserFromRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function requestWithCookie(value?: string): NextRequest {
    const headers = new Headers();
    if (value !== undefined) {
      headers.set("cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`);
    }
    return new NextRequest("http://localhost/api/test", { headers });
  }

  it("AUTH0_SECRET で署名されたセッション Cookie からユーザーを返す", async () => {
    vi.stubEnv("AUTH0_SECRET", SECRET);
    const token = await createSessionToken({ sub: "auth0|abc" }, SECRET);
    expect(await getSessionUserFromRequest(requestWithCookie(token))).toEqual({ sub: "auth0|abc" });
  });

  it("Cookie が無ければ null", async () => {
    vi.stubEnv("AUTH0_SECRET", SECRET);
    expect(await getSessionUserFromRequest(requestWithCookie())).toBeNull();
  });

  it("細工した平文 JSON Cookie では null(修正前は sub を信用していた)", async () => {
    vi.stubEnv("AUTH0_SECRET", SECRET);
    const forged = JSON.stringify({ sub: "auth0|victim", email: "victim@example.com" });
    expect(await getSessionUserFromRequest(requestWithCookie(forged))).toBeNull();
  });

  it("AUTH0_SECRET が未設定なら null", async () => {
    vi.stubEnv("AUTH0_SECRET", "");
    const token = await createSessionToken({ sub: "auth0|abc" }, SECRET);
    expect(await getSessionUserFromRequest(requestWithCookie(token))).toBeNull();
  });
});
