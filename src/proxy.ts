import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const userDomain = "paideia.pucp.tech"

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]

  if (host === userDomain && !request.nextUrl.pathname.startsWith("/usuario")) {
    return NextResponse.rewrite(new URL("/usuario", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
