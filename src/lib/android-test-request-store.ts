export type AndroidRequestStatus = "queued" | "processing" | "done" | "failed";

export interface AndroidTestRequestJob {
  requestId: string;
  userId: string;
  platform: "android";
  status: AndroidRequestStatus;
  createdAt: string;
  updatedAt: string;
  processingStartedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  attemptCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  testJoinUrl: string | null;
}

interface CreateJobResult {
  job: AndroidTestRequestJob;
  reused: boolean;
}

import { neon } from "@neondatabase/serverless";

const jobStore = new Map<string, AndroidTestRequestJob>();
const databaseUrl = process.env.DATABASE_URL;
const sql = databaseUrl ? neon(databaseUrl) : null;

function nowIso() {
  return new Date().toISOString();
}

function mapDbRowToJob(row: Record<string, unknown>): AndroidTestRequestJob {
  return {
    requestId: String(row.request_id),
    userId: String(row.user_id),
    platform: "android",
    status: row.status as AndroidRequestStatus,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    processingStartedAt: row.processing_started_at ? new Date(String(row.processing_started_at)).toISOString() : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null,
    failedAt: row.failed_at ? new Date(String(row.failed_at)).toISOString() : null,
    attemptCount: Number(row.attempt_count),
    errorCode: row.error_code ? String(row.error_code) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
    testJoinUrl: row.test_join_url ? String(row.test_join_url) : null,
  };
}

function canTransition(from: AndroidRequestStatus, to: AndroidRequestStatus): boolean {
  if (from === "queued" && to === "processing") {
    return true;
  }

  if (from === "processing" && (to === "done" || to === "failed")) {
    return true;
  }

  return false;
}

export async function createOrReuseQueuedJob(userId: string): Promise<CreateJobResult> {
  if (sql) {
    const existingRows = await sql`
      select *
      from android_test_request_jobs
      where user_id = ${userId}
        and status in ('queued', 'processing')
      order by created_at desc
      limit 1
    `;

    if (existingRows.length > 0) {
      return { job: mapDbRowToJob(existingRows[0] as Record<string, unknown>), reused: true };
    }

    const requestId = crypto.randomUUID();

    const insertedRows = await sql`
      insert into android_test_request_jobs
      (request_id, user_id, platform, status, attempt_count)
      values (${requestId}, ${userId}, 'android', 'queued', 0)
      returning *
    `;

    return {
      job: mapDbRowToJob(insertedRows[0] as Record<string, unknown>),
      reused: false,
    };
  }

  for (const job of jobStore.values()) {
    if (job.userId === userId && (job.status === "queued" || job.status === "processing")) {
      return { job, reused: true };
    }
  }

  const timestamp = nowIso();
  const requestId = crypto.randomUUID();

  const newJob: AndroidTestRequestJob = {
    requestId,
    userId,
    platform: "android",
    status: "queued",
    createdAt: timestamp,
    updatedAt: timestamp,
    processingStartedAt: null,
    completedAt: null,
    failedAt: null,
    attemptCount: 0,
    errorCode: null,
    errorMessage: null,
    testJoinUrl: null,
  };

  jobStore.set(requestId, newJob);
  return { job: newJob, reused: false };
}

export async function getJobById(requestId: string): Promise<AndroidTestRequestJob | null> {
  if (sql) {
    const rows = await sql`
      select *
      from android_test_request_jobs
      where request_id = ${requestId}
      limit 1
    `;

    if (rows.length === 0) {
      return null;
    }

    return mapDbRowToJob(rows[0] as Record<string, unknown>);
  }

  return jobStore.get(requestId) ?? null;
}

interface TransitionInput {
  toStatus: AndroidRequestStatus;
  errorCode?: string;
  errorMessage?: string;
  testJoinUrl?: string;
}

export async function transitionJobStatus(requestId: string, input: TransitionInput): Promise<AndroidTestRequestJob> {
  if (sql) {
    const rows = await sql`
      select *
      from android_test_request_jobs
      where request_id = ${requestId}
      limit 1
    `;

    if (rows.length === 0) {
      throw new Error("NOT_FOUND");
    }

    const existing = mapDbRowToJob(rows[0] as Record<string, unknown>);

    if (!canTransition(existing.status, input.toStatus)) {
      throw new Error("INVALID_TRANSITION");
    }

    const updatedRows = await sql`
      update android_test_request_jobs
      set
        status = ${input.toStatus},
        updated_at = now(),
        processing_started_at = case
          when ${input.toStatus} = 'processing' then now()
          else processing_started_at
        end,
        attempt_count = case
          when ${input.toStatus} = 'processing' then attempt_count + 1
          else attempt_count
        end,
        completed_at = case
          when ${input.toStatus} = 'done' then now()
          else completed_at
        end,
        failed_at = case
          when ${input.toStatus} = 'failed' then now()
          else failed_at
        end,
        error_code = case
          when ${input.toStatus} = 'failed' then ${input.errorCode ?? "UNEXPECTED_ERROR"}
          when ${input.toStatus} in ('processing', 'done') then null
          else error_code
        end,
        error_message = case
          when ${input.toStatus} = 'failed' then ${input.errorMessage ?? "Unknown error"}
          when ${input.toStatus} in ('processing', 'done') then null
          else error_message
        end,
        test_join_url = case
          when ${input.toStatus} = 'done' then coalesce(${input.testJoinUrl ?? null}, test_join_url)
          else test_join_url
        end
      where request_id = ${requestId}
      returning *
    `;

    return mapDbRowToJob(updatedRows[0] as Record<string, unknown>);
  }

  const existing = jobStore.get(requestId);
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  if (!canTransition(existing.status, input.toStatus)) {
    throw new Error("INVALID_TRANSITION");
  }

  const timestamp = nowIso();

  const updated: AndroidTestRequestJob = {
    ...existing,
    status: input.toStatus,
    updatedAt: timestamp,
  };

  if (input.toStatus === "processing") {
    updated.processingStartedAt = timestamp;
    updated.attemptCount = existing.attemptCount + 1;
    updated.errorCode = null;
    updated.errorMessage = null;
  }

  if (input.toStatus === "done") {
    updated.completedAt = timestamp;
    updated.testJoinUrl = input.testJoinUrl ?? existing.testJoinUrl;
    updated.errorCode = null;
    updated.errorMessage = null;
  }

  if (input.toStatus === "failed") {
    updated.failedAt = timestamp;
    updated.errorCode = input.errorCode ?? "UNEXPECTED_ERROR";
    updated.errorMessage = input.errorMessage ?? "Unknown error";
  }

  jobStore.set(requestId, updated);
  return updated;
}
