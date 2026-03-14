"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Calendar, Users, ChevronRight, Swords } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllCompetitions } from "@/lib/api";
import type { CompetitionSummary } from "@/lib/types";

function StatusBadge({ status }: { status: string }) {
  if (status === "PROCEEDING")
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
        🟢 진행 중
      </span>
    );
  if (status === "READY")
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">
        🔵 준비 중
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black bg-white/5 text-muted-foreground border border-white/10">
      ⚫ 종료
    </span>
  );
}

function DdayBadge({ endDate, status }: { endDate: string; status: string }) {
  if (status === "FINISHED") return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return <span className="text-xs font-black text-destructive">D-DAY</span>;
  return <span className="text-xs font-bold text-primary">D-{diff}</span>;
}

function CompetitionCard({ competition, index }: { competition: CompetitionSummary; index: number }) {
  const isActive = competition.status === "PROCEEDING";
  const isReady = competition.status === "READY";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
    >
      <Link href={`/competition/${competition.id}`}>
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 transition-colors hover:bg-card/80 cursor-pointer ${
            isActive
              ? "border-emerald-500/25 bg-gradient-to-br from-emerald-950/20 via-card to-card"
              : isReady
              ? "border-blue-500/20 bg-gradient-to-br from-blue-950/15 via-card to-card"
              : "border-border/30 bg-card"
          }`}
        >
          {/* 배경 글로우 */}
          {isActive && (
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.06),transparent_60%)]" />
          )}

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={competition.status} />
                <DdayBadge endDate={competition.endDate} status={competition.status} />
              </div>

              <h2 className="text-base font-black text-foreground leading-snug">{competition.title}</h2>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {competition.startDate} ~ {competition.endDate}
                </span>
                {competition.teamCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {competition.teamCount}개 팀
                  </span>
                )}
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CompetitionListPage() {
  const [competitions, setCompetitions] = useState<CompetitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllCompetitions()
      .then((res) => {
        if (res.success) setCompetitions(res.data);
        else setError("대회 목록을 불러올 수 없습니다.");
      })
      .catch(() => setError("대회 목록을 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, []);

  const proceeding = competitions.filter((c) => c.status === "PROCEEDING");
  const ready = competitions.filter((c) => c.status === "READY");
  const finished = competitions.filter((c) => c.status === "FINISHED");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold tracking-tight">
            <Swords className="mr-2 inline-block h-8 w-8 text-primary" />대회
          </h1>
          <p className="mt-1 text-muted-foreground">진행 중이거나 예정된 대회를 확인하세요</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Trophy className="h-12 w-12 mb-3 opacity-20" />
            <p>{error}</p>
          </div>
        ) : competitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Trophy className="h-12 w-12 mb-3 opacity-20" />
            <p>등록된 대회가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {proceeding.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest px-1">진행 중</h2>
                {proceeding.map((c, i) => <CompetitionCard key={c.id} competition={c} index={i} />)}
              </section>
            )}
            {ready.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest px-1">예정</h2>
                {ready.map((c, i) => <CompetitionCard key={c.id} competition={c} index={proceeding.length + i} />)}
              </section>
            )}
            {finished.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">종료된 대회</h2>
                {finished.map((c, i) => <CompetitionCard key={c.id} competition={c} index={proceeding.length + ready.length + i} />)}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
