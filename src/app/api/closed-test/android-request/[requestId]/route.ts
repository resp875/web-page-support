import { NextRequest } from "next/server";
import { handleGetRequest } from "@/lib/closed-test-request-handlers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  return handleGetRequest(req, requestId, "android");
}
