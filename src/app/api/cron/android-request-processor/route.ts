import { NextRequest, NextResponse } from "next/server";
import { claimQueuedJobsForProcessing } from "@/lib/android-test-request-store";

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

    const claimedJobs = await claimQueuedJobsForProcessing(Number.isFinite(limit) ? limit : 5);

    return NextResponse.json({
      processedCount: claimedJobs.length,
      jobs: claimedJobs.map((job) => ({
        requestId: job.requestId,
        status: job.status,
        updatedAt: job.updatedAt,
      })),
      message: claimedJobs.length > 0
        ? `${claimedJobs.length}件の申請をprocessingに遷移しました。`
        : "遷移対象のqueued申請はありませんでした。",
    });
  } catch (error) {
    console.error("Cron android processor error:", error);
    return NextResponse.json({ message: "Cron処理に失敗しました。" }, { status: 500 });
  }
}
