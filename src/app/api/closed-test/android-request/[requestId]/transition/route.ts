import { NextRequest, NextResponse } from "next/server";
import {
  AndroidRequestStatus,
  getJobById,
  transitionJobStatus,
} from "@/lib/android-test-request-store";
import { getAuthSessionFromRequest, getUserIdFromSession } from "@/lib/auth-session";

interface TransitionBody {
  toStatus?: AndroidRequestStatus;
  errorCode?: string;
  errorMessage?: string;
  testJoinUrl?: string;
}

function isAdminRequest(req: NextRequest): boolean {
  const adminKey = process.env.JOB_ADMIN_KEY;
  if (!adminKey) {
    return false;
  }

  const requestKey = req.headers.get("x-job-admin-key");
  return requestKey === adminKey;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const body = (await req.json()) as TransitionBody;
    if (!body.toStatus) {
      return NextResponse.json({ message: "toStatus は必須です。" }, { status: 400 });
    }

    const { requestId } = await params;
    const existing = await getJobById(requestId);

    if (!existing) {
      return NextResponse.json({ message: "対象の申請が見つかりません。" }, { status: 404 });
    }

    const admin = isAdminRequest(req);
    if (!admin) {
      const session = getAuthSessionFromRequest(req);
      const userId = getUserIdFromSession(session);

      if (!userId) {
        return NextResponse.json({ message: "ログインが必要です。" }, { status: 401 });
      }

      if (existing.userId !== userId) {
        return NextResponse.json({ message: "この申請の更新権限がありません。" }, { status: 403 });
      }
    }

    const updated = await transitionJobStatus(requestId, {
      toStatus: body.toStatus,
      errorCode: body.errorCode,
      errorMessage: body.errorMessage,
      testJoinUrl: body.testJoinUrl,
    });

    return NextResponse.json({
      requestId: updated.requestId,
      status: updated.status,
      updatedAt: updated.updatedAt,
      processingStartedAt: updated.processingStartedAt,
      completedAt: updated.completedAt,
      failedAt: updated.failedAt,
      testJoinUrl: updated.testJoinUrl,
      errorCode: updated.errorCode,
      errorMessage: updated.errorMessage,
      attemptCount: updated.attemptCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_TRANSITION") {
      return NextResponse.json(
        { message: "不正な状態遷移です。queued->processing->done/failed の順序で更新してください。" },
        { status: 409 },
      );
    }

    console.error("Android request transition error:", error);
    return NextResponse.json({ message: "状態遷移の更新に失敗しました。" }, { status: 500 });
  }
}
