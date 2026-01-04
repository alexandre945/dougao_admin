import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // =====================================
  // 🔐 PROTEÇÃO DO ADMIN
  // =====================================
  if (pathname.startsWith("/admin")) {
    const isLogged = req.cookies.get("admin-auth")?.value === "true";

    if (!isLogged) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // =====================================
  // 🌐 CORS PARA API
  // =====================================
  if (pathname.startsWith("/api")) {
    // Preflight (OPTIONS)
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const res = NextResponse.next();

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};

