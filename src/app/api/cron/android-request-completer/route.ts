import { NextRequest, NextResponse } from "next/server";
import {
  listJobsByStatus,
  transitionJobStatus,
} from "@/lib/android-test-request-store";
import { getAndroidTestEnrollmentService } from "@/lib/android-test-enrollment-service";

function isAuthorizedCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  const authHeader = req.headers.get("authorization") || "";
  return authHeader === `Bearer ${cronSecret}`;
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
    const enrollmentService = getAndroidTestEnrollmentService();

    const succeededRequestIds: string[] = [];
    const failedRequestIds: string[] = [];

    for (const job of processingJobs) {
      const result = await enrollmentService.enroll(job);

      if (!result.ok) {
        await transitionJobStatus(job.requestId, {
          toStatus: "failed",
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        });
        failedRequestIds.push(job.requestId);
        continue;
      }

      await transitionJobStatus(job.requestId, {
        toStatus: "done",
        testJoinUrl: result.testJoinUrl,
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
