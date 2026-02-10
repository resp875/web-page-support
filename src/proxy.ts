import { auth0 } from './lib/auth0';

export async function proxy(request: Request) {
  return await auth0.middleware(request as any);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};