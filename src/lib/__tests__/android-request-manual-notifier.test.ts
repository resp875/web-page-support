import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyManualTestRequestQueued } from "../android-request-manual-notifier";
import type { AndroidTestRequestJob } from "../android-test-request-store";

function makeJob(overrides: Partial<AndroidTestRequestJob> = {}): AndroidTestRequestJob {
  return {
    requestId: "req-123",
    userId: "auth0|user-1",
    requesterEmail: "tester@example.com",
    platform: "android",
    status: "queued",
    createdAt: "2026-11-08T00:00:00.000Z",
    updatedAt: "2026-11-08T00:00:00.000Z",
    processingStartedAt: null,
    completedAt: null,
    failedAt: null,
    attemptCount: 0,
    errorCode: null,
    errorMessage: null,
    testJoinUrl: null,
    ...overrides,
  };
}

const fetchMock = vi.fn();

function sentPayload() {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return JSON.parse(String(init.body)) as { text: string; blocks: { text?: { text: string } }[] };
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("ANDROID_REQUEST_NOTIFY_WEBHOOK_URL", "https://hooks.example.com/notify");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("notifyManualTestRequestQueued", () => {
  it("webhook URL が未設定なら送信しない", async () => {
    vi.stubEnv("ANDROID_REQUEST_NOTIFY_WEBHOOK_URL", "");
    await notifyManualTestRequestQueued(makeJob());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Android の申請は【Android申請】の文面で送る", async () => {
    await notifyManualTestRequestQueued(makeJob({ platform: "android" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://hooks.example.com/notify");
    const payload = sentPayload();
    expect(payload.text).toBe("【Android申請】新規受付 requestId=req-123 / email=tester@example.com");
    expect(payload.blocks[0].text!.text).toContain("Androidクローズドテスト申請");
  });

  it("iOS の申請は【iOS申請】の文面で送る", async () => {
    await notifyManualTestRequestQueued(makeJob({ platform: "ios" }));

    const payload = sentPayload();
    expect(payload.text).toBe("【iOS申請】新規受付 requestId=req-123 / email=tester@example.com");
    expect(payload.blocks[0].text!.text).toContain("iOS外部テスト(TestFlight)申請");
  });

  it("メールアドレスがない場合は(取得不可)と表示する", async () => {
    await notifyManualTestRequestQueued(makeJob({ platform: "ios", requesterEmail: null }));
    expect(sentPayload().text).toContain("email=(取得不可)");
  });

  it("webhook がエラーを返したら例外を投げる", async () => {
    fetchMock.mockResolvedValue(new Response("bad", { status: 500 }));
    await expect(notifyManualTestRequestQueued(makeJob())).rejects.toThrow("MANUAL_NOTIFY_FAILED:500");
  });
});
