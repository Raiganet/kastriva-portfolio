import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expectedOrigin = `${request.nextUrl.protocol}//${request.headers.get("host") || request.nextUrl.host}`;
  if (!origin || origin !== expectedOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const secure = process.env.NODE_ENV === "production";
  const cookieName = `${secure ? "__Host-" : ""}kastriva_admin_session`;
  if (!verifySession(request.cookies.get(cookieName)?.value, "admin")) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  // Portfolio listing/featured are client-fetched, while detail pages can be ISR cached.
  // Invalidating the portfolio layout clears all nested detail pages after a CMS edit.
  revalidatePath("/portfolio", "layout");
  revalidatePath("/");

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
