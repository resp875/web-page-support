import { NextRequest, NextResponse } from "next/server";
import { listAuditLogsByRequestId } from "@/lib/android-test-request-audit-store";

function isAdminRequest(req: NextRequest): boolean {
  const adminKey = process.env.JOB_ADMIN_KEY;
  if (!adminKey) {
    return false;
  }

  const requestKey = req.headers.get("x-job-admin-key");
  return requestKey === adminKey;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    const logs = await listAuditLogsByRequestId(requestId, 100);

    return NextResponse.json({
      requestId,
      logs,
      totalCount: logs.length,
    });
  } catch (error) {
    console.error("Admin android request audit list error:", error);
    return NextResponse.json({ message: "監査ログの取得に失敗しました。" }, { status: 500 });
  }
}
