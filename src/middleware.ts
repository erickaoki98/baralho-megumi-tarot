import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://app.megumitarot.com.br",
  "https://preview--creative-sales-aid.lovable.app",
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get("origin") ?? "";

  response.headers.set(
    "Content-Security-Policy",
    `frame-ancestors 'self' ${ALLOWED_ORIGINS.join(" ")}`,
  );

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
