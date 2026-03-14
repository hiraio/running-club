"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, ClipboardList, LayoutDashboard, LogOut, Swords, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getNotices } from "@/lib/api";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard",   label: "대시보드",  icon: LayoutDashboard },
  { href: "/competition", label: "대회 현황", icon: Swords },
  { href: "/records",     label: "내 기록",   icon: ClipboardList },
  { href: "/ranking",     label: "랭킹",      icon: Trophy },
  { href: "/notices",     label: "공지사항",  icon: Bell },
];

export function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [hasNewNotice, setHasNewNotice] = useState(false);

  // 새 공지 여부: 마지막 방문 이후 생성된 공지가 있으면 dot 표시
  useEffect(() => {
    const checkNew = async () => {
      try {
        const notices = await getNotices();
        if (notices.length === 0) return;
        const lastSeen = localStorage.getItem("noticesLastSeen");
        if (!lastSeen) { setHasNewNotice(true); return; }
        setHasNewNotice(notices.some((n) => new Date(n.createdAt) > new Date(lastSeen)));
      } catch { /* 무시 */ }
    };
    checkNew();
  }, [pathname]); // 페이지 이동 시마다 재확인

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      {/* ── 데스크탑: 왼쪽 고정 사이드바 ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[220px] flex-col bg-card border-r border-border/50 z-40">
        {/* 로고 */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border/50">
          <span className="text-xl">🏃</span>
          <span className="font-bold text-foreground">Running Club</span>
        </div>

        {/* 사용자 정보 */}
        {user && (
          <div className="px-5 py-3 border-b border-border/50">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.loginId}</p>
          </div>
        )}

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const showDot = href === "/notices" && hasNewNotice && !active;
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <span className="relative shrink-0">
                    <Icon className="h-4 w-4" />
                    {showDot && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-400 ring-2 ring-background" />
                    )}
                  </span>
                  {label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* 로그아웃 */}
        <div className="px-3 py-4 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* ── 모바일: 하단 고정 네비게이션 ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/50 flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const showDot = href === "/notices" && hasNewNotice && !active;
          return (
            <Link key={href} href={href} className="flex-1">
              <div
                className={`flex flex-col items-center justify-center py-2 gap-0.5 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {showDot && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-400 ring-2 ring-background" />
                  )}
                </span>
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
        <button className="flex-1" onClick={handleLogout}>
          <div className="flex flex-col items-center justify-center py-2 gap-0.5 text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium">로그아웃</span>
          </div>
        </button>
      </nav>
    </>
  );
}
