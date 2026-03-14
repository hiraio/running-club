"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getNotices } from "@/lib/api";
import type { NoticeSummary } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Pin, ChevronRight, Megaphone } from "lucide-react";

function NoticeBadge({ isPinned }: { isPinned: boolean }) {
  if (isPinned) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500/20 text-red-400 border border-red-500/40">
        <Pin className="h-2.5 w-2.5" />
        필독
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
      <Megaphone className="h-2.5 w-2.5" />
      대회소식
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 방문 시각 저장 → UserSidebar 새 공지 dot 초기화
  useEffect(() => {
    localStorage.setItem("noticesLastSeen", new Date().toISOString());
  }, []);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getNotices();
      setNotices(data);
    } catch (err) {
      console.error("공지사항 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const pinned = notices.filter((n) => n.isPinned);
  const regular = notices.filter((n) => !n.isPinned);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── 헤더 히어로 — 데스크탑만 ── */}
        <div className="hidden md:block relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950/60 to-slate-900 p-6">
          {/* 배경 글로우 */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.12),transparent_60%)]" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30">
              <Bell className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                공지사항
              </h1>
              <p className="text-sm text-blue-300/70 mt-0.5">
                대회 규칙 · 중간 순위 · 시상 계획
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="h-14 w-14 mb-3 opacity-20" />
            <p className="font-medium">아직 공지사항이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── 필독 섹션 ── */}
            {pinned.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-widest uppercase text-red-400/80 pl-1">
                  필독 공지
                </p>
                <div className="space-y-2">
                  {pinned.map((notice) => (
                    <NoticeCard
                      key={notice.id}
                      notice={notice}
                      onClick={() => router.push(`/notices/${notice.id}`)}
                      variant="pinned"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── 일반 공지 섹션 ── */}
            {regular.length > 0 && (
              <div className="space-y-2">
                {pinned.length > 0 && (
                  <p className="text-xs font-semibold tracking-widest uppercase text-blue-400/80 pl-1">
                    대회 소식
                  </p>
                )}
                <div className="space-y-2">
                  {regular.map((notice) => (
                    <NoticeCard
                      key={notice.id}
                      notice={notice}
                      onClick={() => router.push(`/notices/${notice.id}`)}
                      variant="regular"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NoticeCard({
  notice,
  onClick,
  variant,
}: {
  notice: NoticeSummary;
  onClick: () => void;
  variant: "pinned" | "regular";
}) {
  const isPinned = variant === "pinned";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all duration-200 group
        ${
          isPinned
            ? "border-red-500/25 bg-red-950/10 hover:border-red-400/50 hover:bg-red-950/20"
            : "border-blue-500/15 bg-slate-900/40 hover:border-blue-400/40 hover:bg-slate-900/60"
        }`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* 왼쪽 컬러 바 */}
        <div
          className={`w-0.5 self-stretch rounded-full shrink-0 ${
            isPinned ? "bg-red-500/60" : "bg-blue-500/40"
          }`}
        />

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <NoticeBadge isPinned={isPinned} />
            <span className="font-semibold text-sm text-foreground truncate">
              {notice.title}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(notice.createdAt)}
          </p>
        </div>

        <ChevronRight
          className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5
            ${isPinned ? "text-red-400/50" : "text-blue-400/40"}`}
        />
      </div>
    </button>
  );
}
