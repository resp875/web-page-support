import { NextRequest, NextResponse } from "next/server";
import { createOrReuseQueuedJob } from "@/lib/android-test-request-store";
import { getAuthSessionFromRequest, getUserIdFromSession } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  try {
    const session = getAuthSessionFromRequest(req);
    const userId = getUserIdFromSession(session);

    if (!userId) {
      return NextResponse.json(
        {
          message: "ログイン済みユーザーのみ申請できます。",
        },
        { status: 401 },
      );
    }

    const { job, reused } = createOrReuseQueuedJob(userId);

    const message = reused
      ? "処理中または受付済みの申請があります。現在の状態をご確認ください。"
      : "Androidクローズドテストの参加リクエストを受け付けました。処理完了後に参加URLをご案内します。";

    return NextResponse.json(
      {
        requestId: job.requestId,
        status: job.status,
        message,
        reused,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
      { status: reused ? 200 : 202 },
    );
  } catch (error) {
    console.error("Android closed test request error:", error);
    return NextResponse.json(
      {
        message: "参加リクエストの処理に失敗しました。時間をおいて再度お試しください。",
      },
      { status: 500 },
    );
  }
}
