import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("auth_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        {
          message: "ログイン済みユーザーのみ申請できます。",
        },
        { status: 401 },
      );
    }

    const requestId = crypto.randomUUID();

    return NextResponse.json(
      {
        requestId,
        status: "queued",
        message:
          "Androidクローズドテストの参加リクエストを受け付けました。処理完了後に参加URLをご案内します。",
      },
      { status: 202 },
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
