import { NextRequest, NextResponse } from "next/server";

function isAuthorizedCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  const authHeader = req.headers.get("authorization") || "";
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      message: "このCronエンドポイントは廃止されました。管理APIで awaiting_manual -> done/failed へ更新してください。",
    },
    { status: 410 },
  );
}
