import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  AndroidRequestStatus,
  getJobById,
  transitionJobStatus,
} from "@/lib/android-test-request-store";
import { createAuditLog } from "@/lib/android-test-request-audit-store";

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

function getAdminActorId(req: NextRequest): string {
  const requestKey = req.headers.get("x-job-admin-key") || "";
  return createHash("sha256").update(requestKey).digest("hex").slice(0, 12);
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

    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { message: "この操作は管理者のみ実行できます。x-job-admin-key を指定してください。" },
        { status: 403 },
      );
    }

    const updated = await transitionJobStatus(requestId, {
      toStatus: body.toStatus,
      errorCode: body.errorCode,
      errorMessage: body.errorMessage,
      testJoinUrl: body.testJoinUrl,
    });

    try {
      await createAuditLog({
        requestId,
        fromStatus: existing.status,
        toStatus: updated.status,
        actorType: "admin_key",
        actorId: getAdminActorId(req),
        metadata: {
          errorCode: body.errorCode ?? null,
          hasErrorMessage: Boolean(body.errorMessage),
        },
      });
    } catch (auditError) {
      console.error("Android request audit log error:", auditError);
    }

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
        { message: "不正な状態遷移です。queued->awaiting_manual->done/failed の順序で更新してください。" },
        { status: 409 },
      );
    }

    console.error("Android request transition error:", error);
    return NextResponse.json({ message: "状態遷移の更新に失敗しました。" }, { status: 500 });
  }
}
