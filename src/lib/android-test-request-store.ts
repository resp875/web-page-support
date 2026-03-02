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

const jobStore = new Map<string, AndroidTestRequestJob>();

function nowIso() {
  return new Date().toISOString();
}

export function createOrReuseQueuedJob(userId: string): CreateJobResult {
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

export function getJobById(requestId: string): AndroidTestRequestJob | null {
  return jobStore.get(requestId) ?? null;
}

interface TransitionInput {
  toStatus: AndroidRequestStatus;
  errorCode?: string;
  errorMessage?: string;
  testJoinUrl?: string;
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

export function transitionJobStatus(requestId: string, input: TransitionInput): AndroidTestRequestJob {
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
