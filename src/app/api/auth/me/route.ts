import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('auth_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    const session = JSON.parse(sessionCookie);
    const accessToken = session.access_token;
    
    if (!accessToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    // Fetch user info from Auth0
    const domain = process.env.AUTH0_DOMAIN;
    if (!domain) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }
    
    const userInfoResponse = await fetch(`https://${domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    const user = await userInfoResponse.json();
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('User info error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
