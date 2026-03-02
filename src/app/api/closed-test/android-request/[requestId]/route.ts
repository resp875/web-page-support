import { NextRequest, NextResponse } from "next/server";
import { getJobById } from "@/lib/android-test-request-store";
import { getAuthSessionFromRequest, getUserIdFromSession } from "@/lib/auth-session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const session = getAuthSessionFromRequest(req);
    const userId = getUserIdFromSession(session);

    if (!userId) {
      return NextResponse.json({ message: "ログインが必要です。" }, { status: 401 });
    }

    const { requestId } = await params;
    const job = await getJobById(requestId);

    if (!job) {
      return NextResponse.json({ message: "対象の申請が見つかりません。" }, { status: 404 });
    }

    if (job.userId !== userId) {
      return NextResponse.json({ message: "この申請の参照権限がありません。" }, { status: 403 });
    }

    return NextResponse.json({
      requestId: job.requestId,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      processingStartedAt: job.processingStartedAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      testJoinUrl: job.testJoinUrl,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage,
    });
  } catch (error) {
    console.error("Android request status error:", error);
    return NextResponse.json({ message: "申請ステータスの取得に失敗しました。" }, { status: 500 });
  }
}
