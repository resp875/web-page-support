import { NextRequest } from "next/server";
import { handleCreateRequest } from "@/lib/closed-test-request-handlers";

export async function POST(req: NextRequest) {
  return handleCreateRequest(req, "ios");
}
