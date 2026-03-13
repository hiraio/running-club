"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Trophy,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "관리자 홈", icon: ShieldCheck, exact: true },
  { href: "/admin/approvals", label: "기록 승인", icon: ClipboardCheck },
  { href: "/admin/competitions", label: "대회 관리", icon: Trophy },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* ── 데스크탑: 왼쪽 고정 사이드바 ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[220px] flex-col bg-card border-r border-border/50 z-40">
        {/* 로고 + 관리자 뱃지 */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border/50">
          <span className="text-xl">🏃</span>
          <div>
            <p className="font-bold text-foreground leading-none">Running Club</p>
            <span className="text-[10px] text-primary font-medium">관리자</span>
          </div>
        </div>

        {/* 관리자 정보 */}
        {user && (
          <div className="px-5 py-3 border-b border-border/50">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.loginId}</p>
          </div>
        )}

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
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
                  <Icon className="h-4 w-4 shrink-0" />
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
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} className="flex-1">
              <div
                className={`flex flex-col items-center justify-center py-2 gap-0.5 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
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
