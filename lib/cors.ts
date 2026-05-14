import { NextResponse } from "next/server";

// L3 fix: CORS headers for public widget endpoints embedded on third-party sites
export const WIDGET_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function widgetCorsResponse(): NextResponse {
  return new NextResponse(null, { status: 204, headers: WIDGET_CORS_HEADERS });
}

export function withWidgetCors(response: NextResponse): NextResponse {
  Object.entries(WIDGET_CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
