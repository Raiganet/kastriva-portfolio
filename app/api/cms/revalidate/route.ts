import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expectedOrigin = `${request.nextUrl.protocol}//${request.headers.get("host") || request.nextUrl.host}`;
  if (!origin || origin !== expectedOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ success: false }, { status: 403 });
  }
  revalidateTag("site-content");
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
