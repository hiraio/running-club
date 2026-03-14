import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("user-role")?.value;

  // /admin/** → ADMIN만 접근 가능
  if (pathname.startsWith("/admin")) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // /dashboard, /records, /competition → 로그인 필요, ADMIN이면 /admin으로
  if (pathname === "/dashboard" || pathname.startsWith("/records") || pathname === "/competition") {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // /setup-account → 로그인 필요 (미인증이면 /login으로)
  if (pathname === "/setup-account") {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 이미 로그인 상태에서 /login 접근 → 역할별 홈으로
  if (pathname === "/login" && role) {
    const dest = role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // /notices 는 matcher에서 의도적으로 제외 — 인증 없이 누구나 접근 가능
  matcher: ["/admin/:path*", "/dashboard", "/competition", "/records/:path*", "/login", "/setup-account"],
};
