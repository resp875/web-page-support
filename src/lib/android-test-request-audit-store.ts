import { neon } from "@neondatabase/serverless";
import { AndroidRequestStatus } from "@/lib/android-test-request-store";

export interface AndroidTestRequestAuditLog {
  id: string;
  requestId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface CreateAuditLogInput {
  requestId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}

const databaseUrl = process.env.DATABASE_URL;
const sql = databaseUrl ? neon(databaseUrl) : null;
const auditStore: AndroidTestRequestAuditLog[] = [];

function mapDbRowToAuditLog(row: Record<string, unknown>): AndroidTestRequestAuditLog {
  const rawMetadata = row.metadata;
  const metadata =
    rawMetadata && typeof rawMetadata === "object" && !Array.isArray(rawMetadata)
      ? (rawMetadata as Record<string, unknown>)
      : {};

  return {
    id: String(row.id),
    requestId: String(row.request_id),
    fromStatus: String(row.from_status),
    toStatus: String(row.to_status),
    actorType: String(row.actor_type),
    actorId: row.actor_id ? String(row.actor_id) : null,
    metadata,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<AndroidTestRequestAuditLog> {
  const metadata = input.metadata ?? {};

  if (sql) {
    const rows = await sql`
      insert into android_test_request_audit_logs
      (request_id, from_status, to_status, actor_type, actor_id, metadata)
      values (
        ${input.requestId},
        ${input.fromStatus},
        ${input.toStatus},
        ${input.actorType},
        ${input.actorId ?? null},
        ${JSON.stringify(metadata)}::jsonb
      )
      returning *
    `;

    return mapDbRowToAuditLog(rows[0] as Record<string, unknown>);
  }

  const created: AndroidTestRequestAuditLog = {
    id: crypto.randomUUID(),
    requestId: input.requestId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    metadata,
    createdAt: new Date().toISOString(),
  };

  auditStore.unshift(created);
  return created;
}

export async function listAuditLogsByRequestId(requestId: string, limit = 50): Promise<AndroidTestRequestAuditLog[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));

  if (sql) {
    const rows = await sql`
      select *
      from android_test_request_audit_logs
      where request_id = ${requestId}
      order by created_at desc
      limit ${safeLimit}
    `;

    return rows.map((row) => mapDbRowToAuditLog(row as Record<string, unknown>));
  }

  return auditStore
    .filter((item) => item.requestId === requestId)
    .slice(0, safeLimit);
}

export function isTerminalStatus(status: AndroidRequestStatus): boolean {
  return status === "done" || status === "failed";
}
