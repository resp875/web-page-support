import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  AndroidRequestStatus,
  TestRequestPlatform,
  createOrReuseQueuedJob,
  getJobById,
  transitionJobStatus,
} from "@/lib/android-test-request-store";
import { createAuditLog } from "@/lib/android-test-request-audit-store";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { notifyManualTestRequestQueued } from "@/lib/android-request-manual-notifier";

// Android / iOS のテスト参加申請APIで共通の処理。
// 各プラットフォームのルートは platform を渡してこれらを呼ぶだけにする。

const PLATFORM_LABEL: Record<TestRequestPlatform, string> = {
  android: "Android",
  ios: "iOS",
};

const ACCEPTED_MESSAGE: Record<TestRequestPlatform, string> = {
  android: "Androidクローズドテストの参加リクエストを受け付けました。運用担当が手動対応し、状態を更新します。",
  ios: "iOS外部テスト(TestFlight)の参加リクエストを受け付けました。運用担当が登録メールアドレス宛てに招待を送り、状態を更新します。",
};

export function isAdminRequest(req: NextRequest): boolean {
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

export async function handleCreateRequest(req: NextRequest, platform: TestRequestPlatform): Promise<NextResponse> {
  try {
    const user = await getSessionUserFromRequest(req);
    const userId = user?.sub ?? null;
    const requesterEmail = user?.email ?? null;

    if (!userId) {
      return NextResponse.json({ message: "ログイン済みユーザーのみ申請できます。" }, { status: 401 });
    }

    const { job, reused } = await createOrReuseQueuedJob(userId, requesterEmail, platform);

    if (!reused) {
      try {
        await notifyManualTestRequestQueued(job);
      } catch (notificationError) {
        console.error("Manual notify error:", notificationError);
      }
    }

    const message = reused
      ? "処理中または受付済みの申請があります。現在の状態をご確認ください。"
      : ACCEPTED_MESSAGE[platform];

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
    console.error(`${PLATFORM_LABEL[platform]} closed test request error:`, error);
    return NextResponse.json(
      { message: "参加リクエストの処理に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 },
    );
  }
}

export async function handleGetRequest(
  req: NextRequest,
  requestId: string,
  platform: TestRequestPlatform,
): Promise<NextResponse> {
  try {
    const user = await getSessionUserFromRequest(req);
    const userId = user?.sub ?? null;

    if (!userId) {
      return NextResponse.json({ message: "ログインが必要です。" }, { status: 401 });
    }

    const job = await getJobById(requestId);

    if (!job || job.platform !== platform) {
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
    console.error(`${PLATFORM_LABEL[platform]} request status error:`, error);
    return NextResponse.json({ message: "申請ステータスの取得に失敗しました。" }, { status: 500 });
  }
}

interface TransitionBody {
  toStatus?: AndroidRequestStatus;
  errorCode?: string;
  errorMessage?: string;
  testJoinUrl?: string;
}

export async function handleTransition(
  req: NextRequest,
  requestId: string,
  platform: TestRequestPlatform,
): Promise<NextResponse> {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { message: "この操作は管理者のみ実行できます。x-job-admin-key を指定してください。" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as TransitionBody;
    if (!body.toStatus) {
      return NextResponse.json({ message: "toStatus は必須です。" }, { status: 400 });
    }

    const existing = await getJobById(requestId);

    if (!existing || existing.platform !== platform) {
      return NextResponse.json({ message: "対象の申請が見つかりません。" }, { status: 404 });
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
      console.error(`${PLATFORM_LABEL[platform]} request audit log error:`, auditError);
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

    console.error(`${PLATFORM_LABEL[platform]} request transition error:`, error);
    return NextResponse.json({ message: "状態遷移の更新に失敗しました。" }, { status: 500 });
  }
}
