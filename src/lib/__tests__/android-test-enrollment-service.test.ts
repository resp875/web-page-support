import { describe, expect, it, afterEach } from "vitest";
import { getAndroidTestEnrollmentService } from "../android-test-enrollment-service";
import type { AndroidTestRequestJob } from "../android-test-request-store";

function makeJob(overrides: Partial<AndroidTestRequestJob> = {}): AndroidTestRequestJob {
  return {
    requestId: crypto.randomUUID(),
    userId: "user-test",
    requesterEmail: "test@example.com",
    platform: "android",
    status: "awaiting_manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    processingStartedAt: null,
    completedAt: null,
    failedAt: null,
    attemptCount: 1,
    errorCode: null,
    errorMessage: null,
    testJoinUrl: null,
    ...overrides,
  };
}

afterEach(() => {
  delete process.env.ANDROID_MOCK_FORCE_FAIL;
  delete process.env.ANDROID_MOCK_FAIL_SUFFIXES;
  delete process.env.ANDROID_TEST_JOIN_URL;
  delete process.env.ANDROID_ENROLLMENT_PROVIDER;
});

describe("getAndroidTestEnrollmentService (mock/manual プロバイダー)", () => {
  it("デフォルトで ok:true を返す", async () => {
    const service = getAndroidTestEnrollmentService();
    const result = await service.enroll(makeJob());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.testJoinUrl).toContain("play.google.com");
    }
  });

  it("ANDROID_TEST_JOIN_URL 環境変数の URL を使う", async () => {
    process.env.ANDROID_TEST_JOIN_URL = "https://custom.example.com/test";
    const service = getAndroidTestEnrollmentService();
    const result = await service.enroll(makeJob());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.testJoinUrl).toBe("https://custom.example.com/test");
    }
  });

  it("ANDROID_MOCK_FORCE_FAIL=true で ok:false を返す", async () => {
    process.env.ANDROID_MOCK_FORCE_FAIL = "true";
    const service = getAndroidTestEnrollmentService();
    const result = await service.enroll(makeJob());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe("MOCK_PLAY_API_ERROR");
      expect(typeof result.errorMessage).toBe("string");
    }
  });

  it("ANDROID_MOCK_FAIL_SUFFIXES に一致する requestId は失敗する", async () => {
    process.env.ANDROID_MOCK_FAIL_SUFFIXES = "abc, xyz";
    const service = getAndroidTestEnrollmentService();
    const result = await service.enroll(makeJob({ requestId: "req-end-abc" }));

    expect(result.ok).toBe(false);
  });

  it("ANDROID_MOCK_FAIL_SUFFIXES に一致しない requestId は成功する", async () => {
    process.env.ANDROID_MOCK_FAIL_SUFFIXES = "xyz";
    const service = getAndroidTestEnrollmentService();
    const result = await service.enroll(makeJob({ requestId: "req-end-abc" }));

    expect(result.ok).toBe(true);
  });

  it("ANDROID_ENROLLMENT_PROVIDER=manual でも mock と同じ挙動", async () => {
    process.env.ANDROID_ENROLLMENT_PROVIDER = "manual";
    const service = getAndroidTestEnrollmentService();
    const result = await service.enroll(makeJob());
    expect(result.ok).toBe(true);
  });

  it("ANDROID_ENROLLMENT_PROVIDER=mock でも成功する", async () => {
    process.env.ANDROID_ENROLLMENT_PROVIDER = "mock";
    const service = getAndroidTestEnrollmentService();
    const result = await service.enroll(makeJob());
    expect(result.ok).toBe(true);
  });
});
