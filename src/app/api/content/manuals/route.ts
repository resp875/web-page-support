import { NextResponse } from "next/server"

import { manualContentItems } from "@/lib/member-content"

export async function GET() {
  return NextResponse.json({ manuals: manualContentItems })
}
