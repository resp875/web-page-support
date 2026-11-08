import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  userFromIdToken,
} from '@/lib/auth-session';

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function generateState(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ auth0: string[] }> }
) {
  const { auth0: segments } = await params;
  const path = segments?.join('/') || '';
  const isSecureCookie = req.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production';

  try {
    if (path === 'login') {
      const domain = getEnvVar('AUTH0_DOMAIN');
      const clientId = getEnvVar('AUTH0_CLIENT_ID');
      const baseUrl = getEnvVar('AUTH0_APP_BASE_URL');
      
      const state = generateState();
      const returnTo = req.nextUrl.searchParams.get('returnTo') || '/';
      const screenHint = req.nextUrl.searchParams.get('screen_hint');
      
      const authParams = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: `${baseUrl}/api/auth/callback`,
        scope: 'openid profile email',
        state,
      });
      
      if (screenHint) {
        authParams.set('screen_hint', screenHint);
      }
      
      const authUrl = `https://${domain}/authorize?${authParams.toString()}`;
      
      const response = NextResponse.redirect(authUrl);
      // Store state and returnTo in cookie for verification
      response.cookies.set('auth_state', state, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
      });
      response.cookies.set('auth_return_to', returnTo, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'lax',
        maxAge: 600,
      });
      
      return response;
    }

    if (path === 'logout') {
      const domain = getEnvVar('AUTH0_DOMAIN');
      const clientId = getEnvVar('AUTH0_CLIENT_ID');
      const baseUrl = getEnvVar('AUTH0_APP_BASE_URL');
      
      const logoutUrl = `https://${domain}/v2/logout?${new URLSearchParams({
        client_id: clientId,
        returnTo: baseUrl,
      })}`;
      
      const response = NextResponse.redirect(logoutUrl);
      // Clear session cookie
      response.cookies.delete(SESSION_COOKIE_NAME);
      
      return response;
    }

    if (path === 'callback') {
      const code = req.nextUrl.searchParams.get('code');
      const state = req.nextUrl.searchParams.get('state');
      const storedState = req.cookies.get('auth_state')?.value;
      const returnTo = req.cookies.get('auth_return_to')?.value || '/';
      
      if (!code || !state || state !== storedState) {
        return NextResponse.json(
          { error: 'Invalid callback request' },
          { status: 400 }
        );
      }
      
      // Exchange code for tokens
      const domain = getEnvVar('AUTH0_DOMAIN');
      const clientId = getEnvVar('AUTH0_CLIENT_ID');
      const clientSecret = getEnvVar('AUTH0_CLIENT_SECRET');
      const baseUrl = getEnvVar('AUTH0_APP_BASE_URL');
      
      const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: `${baseUrl}/api/auth/callback`,
        }),
      });
      
      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token exchange failed:', error);
        return NextResponse.json(
          { error: 'Token exchange failed' },
          { status: 500 }
        );
      }
      
      const tokens = await tokenResponse.json();
      const user = userFromIdToken(tokens.id_token, { clientId, issuer: `https://${domain}/` });
      if (!user) {
        console.error('Invalid id_token from token endpoint');
        return NextResponse.json({ error: 'Invalid id_token' }, { status: 500 });
      }

      // AUTH0_SECRET で署名したセッションを発行する(Auth0 のトークン自体は保存しない)
      const sessionToken = await createSessionToken(user, getEnvVar('AUTH0_SECRET'));

      // returnTo は自サイト内のパスに限定する(オープンリダイレクト防止)
      const redirectUrl = new URL(returnTo, baseUrl);
      const safeRedirect = redirectUrl.origin === new URL(baseUrl).origin ? redirectUrl : new URL('/', baseUrl);
      const response = NextResponse.redirect(safeRedirect);

      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
      
      // Clear temporary cookies
      response.cookies.delete('auth_state');
      response.cookies.delete('auth_return_to');
      
      return response;
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

