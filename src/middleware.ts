import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/player")) {
    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/player/:path*"],
};
