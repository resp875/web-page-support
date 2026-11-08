import { NextRequest, NextResponse } from "next/server";
import {
  AndroidRequestStatus,
  isTestRequestPlatform,
  listJobsByStatus,
} from "@/lib/android-test-request-store";
import { isAdminRequest } from "@/lib/closed-test-request-handlers";

const ALL_STATUSES: AndroidRequestStatus[] = ["queued", "awaiting_manual", "done", "failed"];

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
    const platformParam = req.nextUrl.searchParams.get("platform");
    const platform = isTestRequestPlatform(platformParam) ? platformParam : undefined;

    const jobs = status
      ? await listJobsByStatus(status, safeLimit, platform)
      : (
          await Promise.all(ALL_STATUSES.map((item) => listJobsByStatus(item, safeLimit, platform)))
        )
          .flat()
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, safeLimit);

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        requestId: job.requestId,
        userId: job.userId,
        platform: job.platform,
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
