import { NextResponse } from "next/server"

import { eventContentItems } from "@/lib/member-content"

export async function GET() {
  return NextResponse.json({ events: eventContentItems })
}
