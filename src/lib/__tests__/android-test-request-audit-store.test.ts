import { describe, expect, it } from "vitest";
import {
  isTerminalStatus,
  createAuditLog,
  listAuditLogsByRequestId,
} from "../android-test-request-audit-store";

// DATABASE_URL が未設定のため、すべて in-memory フォールバックで動作

describe("isTerminalStatus", () => {
  it("done は終端", () => expect(isTerminalStatus("done")).toBe(true));
  it("failed は終端", () => expect(isTerminalStatus("failed")).toBe(true));
  it("queued は非終端", () => expect(isTerminalStatus("queued")).toBe(false));
  it("awaiting_manual は非終端", () => expect(isTerminalStatus("awaiting_manual")).toBe(false));
});

describe("in-memory 監査ログ", () => {
  it("ログを作成して requestId で取得できる", async () => {
    const requestId = crypto.randomUUID();

    const log = await createAuditLog({
      requestId,
      fromStatus: "queued",
      toStatus: "awaiting_manual",
      actorType: "admin",
      actorId: "admin-1",
    });

    expect(log.requestId).toBe(requestId);
    expect(log.fromStatus).toBe("queued");
    expect(log.toStatus).toBe("awaiting_manual");
    expect(log.actorType).toBe("admin");
    expect(log.actorId).toBe("admin-1");
    expect(log.metadata).toEqual({});
    expect(typeof log.id).toBe("string");
    expect(typeof log.createdAt).toBe("string");

    const fetched = await listAuditLogsByRequestId(requestId);
    expect(fetched).toHaveLength(1);
    expect(fetched[0].id).toBe(log.id);
  });

  it("metadata を保存・取得できる", async () => {
    const requestId = crypto.randomUUID();

    await createAuditLog({
      requestId,
      fromStatus: "awaiting_manual",
      toStatus: "done",
      actorType: "admin",
      metadata: { note: "manually approved" },
    });

    const logs = await listAuditLogsByRequestId(requestId);
    expect(logs[0].metadata).toEqual({ note: "manually approved" });
  });

  it("actorId が省略されると null になる", async () => {
    const requestId = crypto.randomUUID();
    const log = await createAuditLog({
      requestId,
      fromStatus: "queued",
      toStatus: "failed",
      actorType: "system",
    });
    expect(log.actorId).toBeNull();
  });

  it("異なる requestId のログは混在しない", async () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();

    await createAuditLog({ requestId: id1, fromStatus: "queued", toStatus: "awaiting_manual", actorType: "admin" });
    await createAuditLog({ requestId: id2, fromStatus: "queued", toStatus: "failed", actorType: "system" });

    const logs1 = await listAuditLogsByRequestId(id1);
    const logs2 = await listAuditLogsByRequestId(id2);

    expect(logs1).toHaveLength(1);
    expect(logs1[0].toStatus).toBe("awaiting_manual");
    expect(logs2).toHaveLength(1);
    expect(logs2[0].toStatus).toBe("failed");
  });

  it("存在しない requestId は空配列", async () => {
    const logs = await listAuditLogsByRequestId("no-such-id");
    expect(logs).toEqual([]);
  });
});
