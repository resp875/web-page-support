import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromRequest } from '@/lib/auth-session';

// 署名を検証したセッションの内容を返す(未ログイン・改ざん・期限切れは user: null)
export async function GET(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  return NextResponse.json({ user }, { status: 200 });
}
