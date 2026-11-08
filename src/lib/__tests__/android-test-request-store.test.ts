import { describe, expect, it } from "vitest";
import {
  createOrReuseQueuedJob,
  getJobById,
  transitionJobStatus,
  listJobsByStatus,
} from "../android-test-request-store";

// DATABASE_URL が未設定のため、すべて in-memory フォールバックで動作
// テスト間の独立性を保つため userId / requestId に crypto.randomUUID() を使用

describe("createOrReuseQueuedJob", () => {
  it("新規ユーザーはジョブを新規作成する", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job, reused } = await createOrReuseQueuedJob(userId, "test@example.com");

    expect(reused).toBe(false);
    expect(job.userId).toBe(userId);
    expect(job.status).toBe("queued");
    expect(job.requesterEmail).toBe("test@example.com");
    expect(job.platform).toBe("android");
    expect(job.attemptCount).toBe(0);
    expect(typeof job.requestId).toBe("string");
  });

  it("既存の queued ジョブを再利用する", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job: first } = await createOrReuseQueuedJob(userId, null);
    const { job: second, reused } = await createOrReuseQueuedJob(userId, null);

    expect(reused).toBe(true);
    expect(second.requestId).toBe(first.requestId);
  });

  it("awaiting_manual ジョブも再利用する", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job: first } = await createOrReuseQueuedJob(userId, null);
    await transitionJobStatus(first.requestId, { toStatus: "awaiting_manual" });

    const { job: second, reused } = await createOrReuseQueuedJob(userId, null);
    expect(reused).toBe(true);
    expect(second.requestId).toBe(first.requestId);
  });

  it("done になった後は新規ジョブを作成する", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job: first } = await createOrReuseQueuedJob(userId, null);
    await transitionJobStatus(first.requestId, { toStatus: "awaiting_manual" });
    await transitionJobStatus(first.requestId, { toStatus: "done" });

    const { job: second, reused } = await createOrReuseQueuedJob(userId, null);
    expect(reused).toBe(false);
    expect(second.requestId).not.toBe(first.requestId);
  });

  it("failed になった後は新規ジョブを作成する", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job: first } = await createOrReuseQueuedJob(userId, null);
    await transitionJobStatus(first.requestId, { toStatus: "awaiting_manual" });
    await transitionJobStatus(first.requestId, { toStatus: "failed" });

    const { job: second, reused } = await createOrReuseQueuedJob(userId, null);
    expect(reused).toBe(false);
    expect(second.requestId).not.toBe(first.requestId);
  });
});

describe("getJobById", () => {
  it("存在しない requestId は null", async () => {
    expect(await getJobById("nonexistent-id")).toBeNull();
  });

  it("作成したジョブを取得できる", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job } = await createOrReuseQueuedJob(userId, "a@b.com");
    const fetched = await getJobById(job.requestId);

    expect(fetched).not.toBeNull();
    expect(fetched!.requestId).toBe(job.requestId);
    expect(fetched!.requesterEmail).toBe("a@b.com");
  });
});

describe("transitionJobStatus", () => {
  it("queued → awaiting_manual", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job } = await createOrReuseQueuedJob(userId, null);
    const updated = await transitionJobStatus(job.requestId, { toStatus: "awaiting_manual" });

    expect(updated.status).toBe("awaiting_manual");
    expect(updated.processingStartedAt).not.toBeNull();
    expect(updated.attemptCount).toBe(1);
    expect(updated.errorCode).toBeNull();
    expect(updated.errorMessage).toBeNull();
  });

  it("awaiting_manual → done (testJoinUrl を保存)", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job } = await createOrReuseQueuedJob(userId, null);
    await transitionJobStatus(job.requestId, { toStatus: "awaiting_manual" });
    const done = await transitionJobStatus(job.requestId, {
      toStatus: "done",
      testJoinUrl: "https://example.com/test",
    });

    expect(done.status).toBe("done");
    expect(done.completedAt).not.toBeNull();
    expect(done.testJoinUrl).toBe("https://example.com/test");
    expect(done.errorCode).toBeNull();
  });

  it("awaiting_manual → failed (errorCode / errorMessage を保存)", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job } = await createOrReuseQueuedJob(userId, null);
    await transitionJobStatus(job.requestId, { toStatus: "awaiting_manual" });
    const failed = await transitionJobStatus(job.requestId, {
      toStatus: "failed",
      errorCode: "TEST_ERROR",
      errorMessage: "Something went wrong",
    });

    expect(failed.status).toBe("failed");
    expect(failed.failedAt).not.toBeNull();
    expect(failed.errorCode).toBe("TEST_ERROR");
    expect(failed.errorMessage).toBe("Something went wrong");
  });

  it("failed 時に errorCode 省略 → デフォルト値", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job } = await createOrReuseQueuedJob(userId, null);
    await transitionJobStatus(job.requestId, { toStatus: "awaiting_manual" });
    const failed = await transitionJobStatus(job.requestId, { toStatus: "failed" });

    expect(failed.errorCode).toBe("UNEXPECTED_ERROR");
    expect(failed.errorMessage).toBe("Unknown error");
  });

  it("存在しない requestId は NOT_FOUND をスロー", async () => {
    await expect(
      transitionJobStatus("bad-id", { toStatus: "awaiting_manual" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("不正な遷移は INVALID_TRANSITION をスロー (queued → done)", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job } = await createOrReuseQueuedJob(userId, null);
    await expect(
      transitionJobStatus(job.requestId, { toStatus: "done" }),
    ).rejects.toThrow("INVALID_TRANSITION");
  });

  it("不正な遷移は INVALID_TRANSITION をスロー (done → failed)", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job } = await createOrReuseQueuedJob(userId, null);
    await transitionJobStatus(job.requestId, { toStatus: "awaiting_manual" });
    await transitionJobStatus(job.requestId, { toStatus: "done" });
    await expect(
      transitionJobStatus(job.requestId, { toStatus: "failed" }),
    ).rejects.toThrow("INVALID_TRANSITION");
  });
});

describe("listJobsByStatus", () => {
  it("作成した queued ジョブがリストに含まれる", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job } = await createOrReuseQueuedJob(userId, null);

    const queuedJobs = await listJobsByStatus("queued", 50);
    expect(queuedJobs.some((j) => j.requestId === job.requestId)).toBe(true);
  });

  it("done になったジョブは queued リストから消える", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job } = await createOrReuseQueuedJob(userId, null);
    await transitionJobStatus(job.requestId, { toStatus: "awaiting_manual" });
    await transitionJobStatus(job.requestId, { toStatus: "done" });

    const queuedJobs = await listJobsByStatus("queued", 50);
    expect(queuedJobs.some((j) => j.requestId === job.requestId)).toBe(false);

    const doneJobs = await listJobsByStatus("done", 50);
    expect(doneJobs.some((j) => j.requestId === job.requestId)).toBe(true);
  });

  it("limit を超えた件数は返さない", async () => {
    // 2件作成して limit=1 で取得
    await createOrReuseQueuedJob(`user-${crypto.randomUUID()}`, null);
    await createOrReuseQueuedJob(`user-${crypto.randomUUID()}`, null);

    const jobs = await listJobsByStatus("queued", 1);
    expect(jobs.length).toBe(1);
  });

  it("limit の最小値は 1 に丸められる", async () => {
    const jobs = await listJobsByStatus("queued", -5);
    expect(jobs.length).toBeGreaterThanOrEqual(0);
    expect(jobs.length).toBeLessThanOrEqual(1);
  });
});

describe("プラットフォーム別のジョブ管理", () => {
  it("platform を省略すると android のジョブになる", async () => {
    const { job } = await createOrReuseQueuedJob(`user-${crypto.randomUUID()}`, null);
    expect(job.platform).toBe("android");
  });

  it("platform=ios を指定すると ios のジョブになり、取得時も ios のまま", async () => {
    const { job } = await createOrReuseQueuedJob(`user-${crypto.randomUUID()}`, "ios@example.com", "ios");
    expect(job.platform).toBe("ios");
    expect((await getJobById(job.requestId))!.platform).toBe("ios");
  });

  it("Android が対応中でも、同じユーザーの iOS 申請は新規作成される", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job: android } = await createOrReuseQueuedJob(userId, null, "android");
    await transitionJobStatus(android.requestId, { toStatus: "awaiting_manual" });

    const { job: ios, reused } = await createOrReuseQueuedJob(userId, null, "ios");
    expect(reused).toBe(false);
    expect(ios.requestId).not.toBe(android.requestId);
    expect(ios.platform).toBe("ios");
  });

  it("iOS が受付済みでも、同じユーザーの Android 申請は新規作成される", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job: ios } = await createOrReuseQueuedJob(userId, null, "ios");

    const { job: android, reused } = await createOrReuseQueuedJob(userId, null, "android");
    expect(reused).toBe(false);
    expect(android.requestId).not.toBe(ios.requestId);
    expect(android.platform).toBe("android");
  });

  it("同じプラットフォームの対応中ジョブは再利用される(iOS)", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job: first } = await createOrReuseQueuedJob(userId, null, "ios");
    await transitionJobStatus(first.requestId, { toStatus: "awaiting_manual" });

    const { job: second, reused } = await createOrReuseQueuedJob(userId, null, "ios");
    expect(reused).toBe(true);
    expect(second.requestId).toBe(first.requestId);
  });

  it("listJobsByStatus は platform で絞り込める", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job: android } = await createOrReuseQueuedJob(userId, null, "android");
    const { job: ios } = await createOrReuseQueuedJob(userId, null, "ios");

    const iosJobs = await listJobsByStatus("queued", 50, "ios");
    expect(iosJobs.some((j) => j.requestId === ios.requestId)).toBe(true);
    expect(iosJobs.some((j) => j.requestId === android.requestId)).toBe(false);
    expect(iosJobs.every((j) => j.platform === "ios")).toBe(true);

    const androidJobs = await listJobsByStatus("queued", 50, "android");
    expect(androidJobs.some((j) => j.requestId === android.requestId)).toBe(true);
    expect(androidJobs.some((j) => j.requestId === ios.requestId)).toBe(false);
  });

  it("listJobsByStatus で platform を省略すると両方を返す", async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const { job: android } = await createOrReuseQueuedJob(userId, null, "android");
    const { job: ios } = await createOrReuseQueuedJob(userId, null, "ios");

    const jobs = await listJobsByStatus("queued", 50);
    expect(jobs.some((j) => j.requestId === android.requestId)).toBe(true);
    expect(jobs.some((j) => j.requestId === ios.requestId)).toBe(true);
  });
});
