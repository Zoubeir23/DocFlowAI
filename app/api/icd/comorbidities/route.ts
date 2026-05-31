import { NextRequest, NextResponse } from "next/server";
import { getRelatedConditions } from "@/lib/who-icd";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (!code) return NextResponse.json([]);

  try {
    const results = await getRelatedConditions(code);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
