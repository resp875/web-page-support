import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  handleCreateRequest,
  handleGetRequest,
  handleTransition,
  isAdminRequest,
} from "../closed-test-request-handlers";
import { createOrReuseQueuedJob, getJobById } from "../android-test-request-store";
import { listAuditLogsByRequestId } from "../android-test-request-audit-store";
import { SESSION_COOKIE_NAME, createSessionToken } from "../auth-session";

// DATABASE_URL 未設定のため in-memory フォールバックで動作する

const ADMIN_KEY = "test-admin-key";
const SESSION_SECRET = "0123456789abcdef0123456789abcdef";

/** AUTH0_SECRET で署名したセッショントークン(本番の callback と同じ形式) */
function signSession(user: { sub: string; email?: string }): Promise<string> {
  return createSessionToken(user, SESSION_SECRET);
}

function makeRequest(
  options: { session?: string; adminKey?: string; body?: unknown } = {},
): NextRequest {
  const headers = new Headers();
  if (options.session) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(options.session)}`);
  }
  if (options.adminKey) {
    headers.set("x-job-admin-key", options.adminKey);
  }
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return new NextRequest("http://localhost/api/closed-test/test", {
    method: options.body !== undefined ? "POST" : "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

function newUserId() {
  return `auth0|${crypto.randomUUID()}`;
}

beforeEach(() => {
  vi.stubEnv("JOB_ADMIN_KEY", ADMIN_KEY);
  vi.stubEnv("AUTH0_SECRET", SESSION_SECRET);
  // 通知 webhook は未設定にして外部送信しない
  vi.stubEnv("ANDROID_REQUEST_NOTIFY_WEBHOOK_URL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isAdminRequest", () => {
  it("JOB_ADMIN_KEY と一致するヘッダーなら true", () => {
    expect(isAdminRequest(makeRequest({ adminKey: ADMIN_KEY }))).toBe(true);
  });

  it("ヘッダーが一致しなければ false", () => {
    expect(isAdminRequest(makeRequest({ adminKey: "wrong" }))).toBe(false);
  });

  it("JOB_ADMIN_KEY が未設定なら、ヘッダーが空でも false", () => {
    vi.stubEnv("JOB_ADMIN_KEY", "");
    expect(isAdminRequest(makeRequest())).toBe(false);
  });
});

describe("handleCreateRequest", () => {
  it("未ログインは 401", async () => {
    const res = await handleCreateRequest(makeRequest({ body: {} }), "ios");
    expect(res.status).toBe(401);
  });

  it("細工した平文 JSON の Cookie では他人として申請できず 401", async () => {
    const forged = JSON.stringify({ sub: newUserId(), email: "victim@example.com" });
    const res = await handleCreateRequest(makeRequest({ session: forged, body: {} }), "ios");
    expect(res.status).toBe(401);
  });

  it("別の secret で署名したセッションは 401", async () => {
    const token = await createSessionToken({ sub: newUserId() }, "fedcba9876543210fedcba9876543210");
    const res = await handleCreateRequest(makeRequest({ session: token, body: {} }), "ios");
    expect(res.status).toBe(401);
  });

  it("iOS の新規申請は 202 で、ios のジョブがメールアドレス付きで作られる", async () => {
    const userId = newUserId();
    const res = await handleCreateRequest(
      makeRequest({ session: await signSession({ sub: userId, email: "ios-user@example.com" }), body: {} }),
      "ios",
    );
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.status).toBe("queued");
    expect(data.reused).toBe(false);
    expect(data.message).toContain("TestFlight");

    const job = await getJobById(data.requestId);
    expect(job!.platform).toBe("ios");
    expect(job!.userId).toBe(userId);
    expect(job!.requesterEmail).toBe("ios-user@example.com");
  });

  it("Android の新規申請メッセージは Android 向けの文言", async () => {
    const res = await handleCreateRequest(
      makeRequest({ session: await signSession({ sub: newUserId() }), body: {} }),
      "android",
    );
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.message).toContain("Android");
    expect((await getJobById(data.requestId))!.platform).toBe("android");
  });

  it("同じプラットフォームで再申請すると 200 で既存ジョブを返す", async () => {
    const session = await signSession({ sub: newUserId() });
    const first = await (await handleCreateRequest(makeRequest({ session, body: {} }), "ios")).json();
    const res = await handleCreateRequest(makeRequest({ session, body: {} }), "ios");
    const second = await res.json();

    expect(res.status).toBe(200);
    expect(second.reused).toBe(true);
    expect(second.requestId).toBe(first.requestId);
  });
});

describe("handleGetRequest", () => {
  it("未ログインは 401", async () => {
    const res = await handleGetRequest(makeRequest(), "any-id", "ios");
    expect(res.status).toBe(401);
  });

  it("存在しない申請は 404", async () => {
    const res = await handleGetRequest(makeRequest({ session: await signSession({ sub: newUserId() }) }), "missing", "ios");
    expect(res.status).toBe(404);
  });

  it("細工した Cookie で他人の申請は参照できない (401)", async () => {
    const victimId = newUserId();
    const { job } = await createOrReuseQueuedJob(victimId, "victim@example.com", "ios");
    const forged = JSON.stringify({ sub: victimId });
    const res = await handleGetRequest(makeRequest({ session: forged }), job.requestId, "ios");
    expect(res.status).toBe(401);
  });

  it("他人の申請は 403", async () => {
    const { job } = await createOrReuseQueuedJob(newUserId(), null, "ios");
    const res = await handleGetRequest(makeRequest({ session: await signSession({ sub: newUserId() }) }), job.requestId, "ios");
    expect(res.status).toBe(403);
  });

  it("別プラットフォームのルートから参照すると 404", async () => {
    const userId = newUserId();
    const { job } = await createOrReuseQueuedJob(userId, null, "android");
    const res = await handleGetRequest(makeRequest({ session: await signSession({ sub: userId }) }), job.requestId, "ios");
    expect(res.status).toBe(404);
  });

  it("本人の申請はステータスを返す", async () => {
    const userId = newUserId();
    const { job } = await createOrReuseQueuedJob(userId, null, "ios");
    const res = await handleGetRequest(makeRequest({ session: await signSession({ sub: userId }) }), job.requestId, "ios");
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.requestId).toBe(job.requestId);
    expect(data.status).toBe("queued");
  });
});

describe("handleTransition", () => {
  it("管理者キーなしは 403 で、状態は変わらない", async () => {
    const { job } = await createOrReuseQueuedJob(newUserId(), null, "ios");
    const res = await handleTransition(
      makeRequest({ body: { toStatus: "awaiting_manual" } }),
      job.requestId,
      "ios",
    );

    expect(res.status).toBe(403);
    expect((await getJobById(job.requestId))!.status).toBe("queued");
  });

  it("toStatus がなければ 400", async () => {
    const { job } = await createOrReuseQueuedJob(newUserId(), null, "ios");
    const res = await handleTransition(makeRequest({ adminKey: ADMIN_KEY, body: {} }), job.requestId, "ios");
    expect(res.status).toBe(400);
  });

  it("存在しない申請は 404", async () => {
    const res = await handleTransition(
      makeRequest({ adminKey: ADMIN_KEY, body: { toStatus: "awaiting_manual" } }),
      "missing",
      "ios",
    );
    expect(res.status).toBe(404);
  });

  it("別プラットフォームのルートから遷移させると 404 で、状態は変わらない", async () => {
    const { job } = await createOrReuseQueuedJob(newUserId(), null, "android");
    const res = await handleTransition(
      makeRequest({ adminKey: ADMIN_KEY, body: { toStatus: "awaiting_manual" } }),
      job.requestId,
      "ios",
    );

    expect(res.status).toBe(404);
    expect((await getJobById(job.requestId))!.status).toBe("queued");
  });

  it("不正な遷移(queued → done)は 409", async () => {
    const { job } = await createOrReuseQueuedJob(newUserId(), null, "ios");
    const res = await handleTransition(
      makeRequest({ adminKey: ADMIN_KEY, body: { toStatus: "done" } }),
      job.requestId,
      "ios",
    );
    expect(res.status).toBe(409);
  });

  it("正しい遷移は状態を更新し、監査ログを残す", async () => {
    const { job } = await createOrReuseQueuedJob(newUserId(), null, "ios");
    const res = await handleTransition(
      makeRequest({ adminKey: ADMIN_KEY, body: { toStatus: "awaiting_manual" } }),
      job.requestId,
      "ios",
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("awaiting_manual");

    const logs = await listAuditLogsByRequestId(job.requestId, 10);
    expect(logs).toHaveLength(1);
    expect(logs[0].fromStatus).toBe("queued");
    expect(logs[0].toStatus).toBe("awaiting_manual");
    expect(logs[0].actorType).toBe("admin_key");
  });
});
