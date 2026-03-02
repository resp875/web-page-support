import { NextRequest, NextResponse } from "next/server";
import {
  listJobsByStatus,
  transitionJobStatus,
} from "@/lib/android-test-request-store";

function isAuthorizedCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  const authHeader = req.headers.get("authorization") || "";
  return authHeader === `Bearer ${cronSecret}`;
}

function shouldMockFail(requestId: string): boolean {
  if (process.env.ANDROID_MOCK_FORCE_FAIL === "true") {
    return true;
  }

  const failSuffixes = (process.env.ANDROID_MOCK_FAIL_SUFFIXES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return failSuffixes.some((suffix) => requestId.endsWith(suffix));
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 5;
    const safeLimit = Number.isFinite(limit) ? limit : 5;

    const processingJobs = await listJobsByStatus("processing", safeLimit);

    const succeededRequestIds: string[] = [];
    const failedRequestIds: string[] = [];

    for (const job of processingJobs) {
      const fail = shouldMockFail(job.requestId);

      if (fail) {
        await transitionJobStatus(job.requestId, {
          toStatus: "failed",
          errorCode: "MOCK_PLAY_API_ERROR",
          errorMessage: "Mock failure from android-request-completer",
        });
        failedRequestIds.push(job.requestId);
        continue;
      }

      const testJoinUrl =
        process.env.ANDROID_TEST_JOIN_URL ||
        "https://play.google.com/apps/testing/com.example.resp";

      await transitionJobStatus(job.requestId, {
        toStatus: "done",
        testJoinUrl,
      });
      succeededRequestIds.push(job.requestId);
    }

    return NextResponse.json({
      checkedCount: processingJobs.length,
      doneCount: succeededRequestIds.length,
      failedCount: failedRequestIds.length,
      doneRequestIds: succeededRequestIds,
      failedRequestIds,
      message:
        processingJobs.length > 0
          ? "processing申請の完了処理を実行しました。"
          : "処理対象のprocessing申請はありませんでした。",
    });
  } catch (error) {
    console.error("Cron android completer error:", error);
    return NextResponse.json({ message: "Cron完了処理に失敗しました。" }, { status: 500 });
  }
}
