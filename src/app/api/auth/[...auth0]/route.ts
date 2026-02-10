// This catch-all route is intentionally disabled because this project
// uses the SDK middleware (`src/proxy.ts`) and the `Auth0Client`.
// If you prefer the route-based handlers, implement them against the
// SDK server APIs. For now return 404 to avoid conflicts.

export async function GET() {
  return new Response(null, { status: 404 });
}

export async function POST() {
  return new Response(null, { status: 404 });
}