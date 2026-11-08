import { NextRequest } from "next/server";
import { handleTransition } from "@/lib/closed-test-request-handlers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  return handleTransition(req, requestId, "ios");
}
