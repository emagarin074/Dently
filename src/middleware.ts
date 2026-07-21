import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all admin routes
  if (pathname.includes("/admin")) {
    const session = request.cookies.get("dently_session")?.value

    if (!session) {
      // Extract clinic slug from the path: /clinic/[slug]/admin/...
      const match = pathname.match(/^\/clinic\/([^/]+)\/admin/)
      if (match) {
        const slug = match[1]
        const loginUrl = new URL(`/clinic/${slug}/login`, request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
      }
      // Fallback to global login
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/clinic/:slug/admin/:path*"],
}
