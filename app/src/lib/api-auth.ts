import { auth } from "@/lib/auth"
import type { Session } from "next-auth"
import { NextResponse } from "next/server"

/**
 * Call at the top of every API route handler.
 * Returns { session, businessId } on success, or a NextResponse 401 to return directly.
 */
export async function requireAuth(): Promise<
  { session: Session; businessId: string } | NextResponse
> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return { session, businessId: session.user.id }
}
