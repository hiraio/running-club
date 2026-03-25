"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import { getNotices } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { NoticeSummary } from "@/lib/types";

const STORAGE_KEY = "readNoticeIds";

/** localStorage에서 읽은 공지 id 목록 가져오기 */
function getReadIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

/** 공지 id를 읽음 처리 */
export function markNoticeAsRead(id: number) {
  const ids = getReadIds();
  ids.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export default function UnreadNoticeBanner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState<NoticeSummary[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (loading || !user || user.role === "ADMIN") return;
    // 공지 페이지에선 배너 안 띄움
    if (pathname.startsWith("/notices")) return;

    const check = async () => {
      try {
        const notices = await getNotices();
        const readIds = getReadIds();
        const unreadList = notices.filter((n) => !readIds.has(n.id));
        setUnread(unreadList);
      } catch {
        // 실패해도 무시
      }
    };
    check();
  }, [user, loading, pathname]);

  if (dismissed || unread.length === 0) return null;

  return (
    <div
      className="mx-4 mt-3 mb-1 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3 cursor-pointer animate-in slide-in-from-top-2 duration-300"
      onClick={() => router.push("/notices")}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
        <Bell className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          확인하지 않은 공지가 {unread.length}건 있습니다
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {unread[0].title}
          {unread.length > 1 && ` 외 ${unread.length - 1}건`}
        </p>
      </div>
      <button
        className="shrink-0 p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground"
        onClick={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
