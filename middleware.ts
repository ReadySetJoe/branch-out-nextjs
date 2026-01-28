import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Authenticated user visiting landing -> redirect to /discover
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/discover", request.url));
  }

  // Unauthenticated user visiting /discover -> redirect to landing
  if (pathname === "/discover" && !token) {
    const url = new URL("/", request.url);
    url.searchParams.set("callbackUrl", "/discover");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/discover"],
};
