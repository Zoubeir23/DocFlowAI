import { NextRequest, NextResponse } from "next/server";
import { searchDrugsWithAtc } from "@/lib/who-atc";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (query.length < 2) return NextResponse.json([]);

  try {
    const results = await searchDrugsWithAtc(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
