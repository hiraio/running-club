import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("user-role")?.value;

  // 로그인 페이지 — 이미 로그인 상태면 역할별 홈으로
  if (pathname === "/login") {
    if (role) {
      const dest = role === "ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // 미인증 → 로그인 페이지로
  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /admin/** → ADMIN만 접근 가능
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // USER가 /admin 외 페이지 접근 시 ADMIN이면 /admin으로
  if (role === "ADMIN" && !pathname.startsWith("/admin") && pathname !== "/setup-account") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // _next 정적 파일, api 라우트, 업로드 사진, favicon 제외하고 모든 경로 적용
    "/((?!_next/static|_next/image|api|photos|favicon.ico).*)",
  ],
};
