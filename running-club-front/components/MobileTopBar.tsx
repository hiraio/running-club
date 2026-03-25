"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// ── 경로 → 페이지 제목 매핑 ────────────────────────────────────
const ROUTE_TITLES: Record<string, string> = {
  "/":            "홈",
  "/dashboard":   "마이페이지",
  "/ranking":     "랭킹",
  "/competition": "대회",
  "/records":     "내 기록",
  "/my-records":  "내 기록",
  "/bingo":       "빙고",
  "/notices":     "공지사항",
};

// ── 서브 페이지 설정 (뒤로가기 버튼 표시) ────────────────────────
interface SubPageConfig {
  pattern: RegExp;
  title: string;
  /** 이동할 경로. "__back__" 이면 router.back() 호출 */
  backTo: string;
}

const SUB_PAGES: SubPageConfig[] = [
  { pattern: /^\/competition\/.+$/, title: "대회 상세",  backTo: "/competition" },
  { pattern: /^\/notices\/.+$/,     title: "공지 상세",  backTo: "/notices" },
  { pattern: /^\/members\/.+$/,     title: "멤버 프로필", backTo: "__back__" },
];

function getPageInfo(pathname: string): { title: string; backTo: string | null } {
  for (const { pattern, title, backTo } of SUB_PAGES) {
    if (pattern.test(pathname)) return { title, backTo };
  }
  return { title: ROUTE_TITLES[pathname] ?? "", backTo: null };
}

export function MobileTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const { title, backTo } = getPageInfo(pathname);

  // 매핑된 제목이 없는 경로(login, join 등)는 렌더 안 함
  if (!title) return null;

  const avatarColor = user?.teamColorCode ?? "#6366f1";
  // 백팀(흰색) 예외 처리
  const isWhiteTeam = avatarColor.toLowerCase() === "#ffffff" || avatarColor.toLowerCase() === "#fff";
  const avatarBg = isWhiteTeam ? "#94a3b8" : avatarColor;

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 bg-card/95 backdrop-blur-sm border-b border-border/50 flex items-center px-2">

      {/* 왼쪽: 뒤로가기 or 빈 자리 */}
      <div className="w-10 flex items-center justify-start">
        {backTo && (
          <button
            onClick={() => backTo === "__back__" ? router.back() : router.push(backTo)}
            aria-label="뒤로가기"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/5 active:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
      </div>

      {/* 중앙: 페이지 제목 */}
      <div className="flex-1 text-center">
        <span className="text-base font-bold text-foreground">{title}</span>
      </div>

      {/* 오른쪽: 프로필 아바타 */}
      <div className="w-10 flex items-center justify-end">
        {user && (
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="마이페이지"
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black text-white transition-opacity hover:opacity-80 active:opacity-60"
            style={{
              background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}bb)`,
              boxShadow: `0 0 8px ${avatarBg}44`,
            }}
          >
            {user.name.slice(0, 1)}
          </button>
        )}
      </div>
    </header>
  );
}
