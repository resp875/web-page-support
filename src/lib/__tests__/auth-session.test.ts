import { describe, expect, it } from "vitest";
import { getUserIdFromSession, getUserEmailFromSession } from "../auth-session";

/** JWT の payload 部分だけを base64url エンコードして返す (署名は偽物) */
function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.fakesig`;
}

describe("getUserIdFromSession", () => {
  it("null セッションは null を返す", () => {
    expect(getUserIdFromSession(null)).toBeNull();
  });

  it("session.sub が直接あればそれを返す", () => {
    expect(getUserIdFromSession({ sub: "user-abc" })).toBe("user-abc");
  });

  it("id_token JWT の sub を取り出す", () => {
    const token = makeJwt({ sub: "jwt-sub-123" });
    expect(getUserIdFromSession({ id_token: token })).toBe("jwt-sub-123");
  });

  it("sub も id_token もなければ access_token の先頭12文字を返す", () => {
    expect(getUserIdFromSession({ access_token: "abcdefghijklmnopqrstuvwxyz" })).toBe(
      "access-token:abcdefghijkl",
    );
  });

  it("識別子が何もない場合は null", () => {
    expect(getUserIdFromSession({ email: "test@example.com" })).toBeNull();
  });

  it("空の sub 文字列は無視して id_token にフォールバック", () => {
    const token = makeJwt({ sub: "from-id-token" });
    // sub が空文字 → falsy → id_token を使う
    expect(getUserIdFromSession({ sub: "", id_token: token })).toBe("from-id-token");
  });
});

describe("getUserEmailFromSession", () => {
  it("null セッションは null を返す", () => {
    expect(getUserEmailFromSession(null)).toBeNull();
  });

  it("session.email が直接あればそれを返す", () => {
    expect(getUserEmailFromSession({ email: "user@example.com" })).toBe("user@example.com");
  });

  it("id_token JWT の email を取り出す", () => {
    const token = makeJwt({ sub: "some-sub", email: "jwt@example.com" });
    expect(getUserEmailFromSession({ id_token: token })).toBe("jwt@example.com");
  });

  it("email が一切ない場合は null", () => {
    expect(getUserEmailFromSession({ sub: "user-abc" })).toBeNull();
  });

  it("id_token に email がなければ null", () => {
    const token = makeJwt({ sub: "only-sub" });
    expect(getUserEmailFromSession({ id_token: token })).toBeNull();
  });
});
