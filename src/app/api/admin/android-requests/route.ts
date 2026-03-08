import { NextRequest, NextResponse } from "next/server";
import {
  AndroidRequestStatus,
  listJobsByStatus,
} from "@/lib/android-test-request-store";

const ALL_STATUSES: AndroidRequestStatus[] = ["queued", "awaiting_manual", "done", "failed"];

function isAdminRequest(req: NextRequest): boolean {
  const adminKey = process.env.JOB_ADMIN_KEY;
  if (!adminKey) {
    return false;
  }

  const requestKey = req.headers.get("x-job-admin-key");
  return requestKey === adminKey;
}

function parseStatus(value: string | null): AndroidRequestStatus | null {
  if (!value) {
    return null;
  }

  if (ALL_STATUSES.includes(value as AndroidRequestStatus)) {
    return value as AndroidRequestStatus;
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const limitParam = Number(req.nextUrl.searchParams.get("limit") || "50");
    const safeLimit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 200)) : 50;

    const status = parseStatus(req.nextUrl.searchParams.get("status"));

    const jobs = status
      ? await listJobsByStatus(status, safeLimit)
      : (
          await Promise.all(ALL_STATUSES.map((item) => listJobsByStatus(item, safeLimit)))
        )
          .flat()
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, safeLimit);

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        requestId: job.requestId,
        userId: job.userId,
        requesterEmail: job.requesterEmail,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        failedAt: job.failedAt,
        errorCode: job.errorCode,
        errorMessage: job.errorMessage,
      })),
      totalCount: jobs.length,
    });
  } catch (error) {
    console.error("Admin android requests list error:", error);
    return NextResponse.json({ message: "申請一覧の取得に失敗しました。" }, { status: 500 });
  }
}
