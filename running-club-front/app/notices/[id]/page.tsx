"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getNotice } from "@/lib/api";
import type { NoticeDetail } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Pin, Megaphone, Calendar } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const data = await getNotice(Number(id));
        setNotice(data);
      } catch {
        setError("공지사항을 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotice();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => router.push("/notices")}
            className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="h-12 w-12 mb-3 opacity-20" />
            <p>{error ?? "공지사항이 존재하지 않습니다."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── 뒤로가기 ── */}
        <Button
          variant="ghost"
          onClick={() => router.push("/notices")}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>

        {/* ── 헤더 카드 ── */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-6
            ${notice.isPinned
              ? "border-red-500/25 bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-900"
              : "border-blue-500/20 bg-gradient-to-br from-blue-950/20 via-slate-900 to-slate-900"
            }`}
        >
          {/* 배경 글로우 */}
          <div
            className={`absolute inset-0 ${
              notice.isPinned
                ? "bg-[radial-gradient(ellipse_at_top_left,_rgba(239,68,68,0.08),transparent_60%)]"
                : "bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.08),transparent_60%)]"
            }`}
          />
          <div
            className={`absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent ${
              notice.isPinned ? "via-red-500/30" : "via-blue-500/30"
            } to-transparent`}
          />

          <div className="relative space-y-3">
            {/* 배지 */}
            {notice.isPinned ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                <Pin className="h-2.5 w-2.5" />
                필독
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
                <Megaphone className="h-2.5 w-2.5" />
                대회소식
              </span>
            )}

            {/* 제목 */}
            <h1 className="text-xl font-bold leading-snug text-white">
              {notice.title}
            </h1>

            {/* 날짜 */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(notice.createdAt)}
            </div>
          </div>
        </div>

        {/* ── 본문 (Markdown) ── */}
        <div className="rounded-xl border border-border/50 bg-card px-6 py-5">
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-strong:text-foreground prose-strong:font-semibold
            prose-em:text-blue-300
            prose-a:text-blue-400 prose-a:underline prose-a:underline-offset-2
            prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
            prose-blockquote:border-l-blue-500/50 prose-blockquote:text-muted-foreground
            prose-ul:text-muted-foreground prose-ol:text-muted-foreground
            prose-li:marker:text-blue-400
            prose-img:rounded-xl prose-img:border prose-img:border-border/50
            prose-hr:border-border/50
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {notice.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* ── 하단 돌아가기 ── */}
        <div className="flex justify-center pb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/notices")}
            className="gap-2 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
