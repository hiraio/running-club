"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { UserSidebar } from "./UserSidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/lib/auth-context";

// 로그인 사용자에게 UserSidebar를 보여줄 경로들
const USER_SIDEBAR_PAGES = ["/dashboard", "/records", "/ranking"];

function isUserPage(pathname: string) {
  return USER_SIDEBAR_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function Navigation() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // 관리자 경로는 항상 AdminSidebar
  if (pathname.startsWith("/admin")) return <AdminSidebar />;

  // 사용자 경로: 로그인 상태 확인 후 사이드바 결정
  if (isUserPage(pathname) && !loading && user) {
    return user.role === "ADMIN" ? <AdminSidebar /> : <UserSidebar />;
  }

  // 비로그인이거나 공개 경로(login, join 등)는 Navbar
  return <Navbar />;
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const hasSidebar =
    pathname.startsWith("/admin") ||
    (isUserPage(pathname) && !!user);

  if (!hasSidebar) return <>{children}</>;

  return (
    <div className="md:pl-[220px] pb-16 md:pb-0 min-h-screen">
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
