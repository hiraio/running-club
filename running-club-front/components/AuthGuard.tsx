"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // 로그인 페이지 — 이미 로그인 상태면 역할별 홈으로
    if (pathname === "/login") {
      if (user) {
        if (user.needsSetup) {
          router.replace("/setup-account");
        } else {
          router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
        }
      }
      return;
    }

    // 미인증 → 로그인 페이지로
    if (!user) {
      router.replace("/login");
      return;
    }

    // /admin/** → ADMIN만 접근 가능
    if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    // ADMIN이 /admin 외 페이지 접근 → /admin으로
    if (
      user.role === "ADMIN" &&
      !pathname.startsWith("/admin") &&
      pathname !== "/setup-account"
    ) {
      router.replace("/admin");
      return;
    }
  }, [user, loading, pathname, router]);

  // 로딩 중 — 빈 화면 (flash 방지)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // 로그인 페이지는 미인증 상태에서도 보여야 함
  if (pathname === "/login" && !user) {
    return <>{children}</>;
  }

  // 미인증이면 children 렌더링하지 않음 (redirect 처리 중)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
