"use client";

import { usePathname } from "next/navigation";
import { UserSidebar } from "./UserSidebar";
import { AdminSidebar } from "./AdminSidebar";
import { MobileTopBar } from "./MobileTopBar";
import { useAuth } from "@/lib/auth-context";

// 로그인 사용자에게 UserSidebar를 보여줄 경로들
const USER_SIDEBAR_PAGES = ["/", "/dashboard", "/competition", "/records", "/ranking", "/bingo", "/notices"];

// 로그인 사용자에게 MobileTopBar(뒤로가기)만 보여줄 경로 패턴 (사이드바 없음)
const MINIMAL_NAV_PATTERNS = [/^\/members\/.+$/];

function isUserPage(pathname: string) {
  return USER_SIDEBAR_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isMinimalNavPage(pathname: string) {
  return MINIMAL_NAV_PATTERNS.some((p) => p.test(pathname));
}

function Navigation() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // 관리자 경로는 항상 AdminSidebar
  if (pathname.startsWith("/admin")) return <AdminSidebar />;

  // 뒤로가기만 필요한 페이지 (멤버 프로필 등)
  if (isMinimalNavPage(pathname) && !loading && user) {
    return <MobileTopBar />;
  }

  // 사용자 경로: 로그인 상태 확인 후 사이드바 결정
  if (isUserPage(pathname) && !loading && user) {
    return user.role === "ADMIN" ? <AdminSidebar /> : <><MobileTopBar /><UserSidebar /></>;
  }

  // 비로그인 또는 login/join 페이지는 네비게이션 없음
  return null;
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // 뒤로가기만 있는 페이지: 모바일만 상단 패딩 (MobileTopBar h-12)
  if (isMinimalNavPage(pathname) && !!user) {
    return (
      <div className="pt-12 md:pt-0 min-h-screen">
        {children}
      </div>
    );
  }

  const hasSidebar =
    pathname.startsWith("/admin") ||
    (isUserPage(pathname) && !!user);

  if (!hasSidebar) return <>{children}</>;

  return (
    <div className="md:pl-[220px] pb-16 md:pb-0 pt-12 md:pt-0 min-h-screen">
      {children}
    </div>
  );
}

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
