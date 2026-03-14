"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Calendar, Users, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllCompetitions, getTeamsByCompetition } from "@/lib/api";
import type { CompetitionSummary, TeamForJoin } from "@/lib/types";

function StatusBadge({ status }: { status: string }) {
  if (status === "PROCEEDING")
    return <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">🟢 진행 중</span>;
  if (status === "READY")
    return <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">🔵 준비 중</span>;
  return <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black bg-white/5 text-muted-foreground border border-white/10">⚫ 종료</span>;
}

function DdayBadge({ endDate, status }: { endDate: string; status: string }) {
  if (status === "FINISHED") return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return <span className="rounded-full bg-destructive/20 px-3 py-1 text-xs font-bold text-destructive animate-pulse">D-DAY</span>;
  return <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">D-{diff}</span>;
}

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [competition, setCompetition] = useState<CompetitionSummary | null>(null);
  const [teams, setTeams] = useState<TeamForJoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const listRes = await getAllCompetitions();
        if (!listRes.success) throw new Error("대회 정보를 불러올 수 없습니다.");
        const found = listRes.data.find((c) => c.id === Number(id));
        if (!found) throw new Error("존재하지 않는 대회입니다.");
        setCompetition(found);

        // 종료 대회는 팀 목록 API가 에러를 던지므로 PROCEEDING/READY만 조회
        if (found.status !== "FINISHED") {
          const teamsRes = await getTeamsByCompetition(Number(id));
          if (teamsRes.success) setTeams(teamsRes.data);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Button variant="ghost" onClick={() => router.push("/competition")} className="mb-6 gap-2 text-muted-foreground hover:text-foreground hidden md:inline-flex">
            <ArrowLeft className="h-4 w-4" />대회 목록
          </Button>
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Swords className="h-12 w-12 mb-3 opacity-20" />
            <p>{error ?? "대회를 찾을 수 없습니다."}</p>
          </div>
        </div>
      </div>
    );
  }

  const isActive = competition.status === "PROCEEDING";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-5">

        {/* 뒤로가기 — 데스크탑만 (모바일은 MobileTopBar에서 처리) */}
        <Button variant="ghost" onClick={() => router.push("/competition")} className="gap-2 text-muted-foreground hover:text-foreground -ml-2 hidden md:inline-flex">
          <ArrowLeft className="h-4 w-4" />대회 목록
        </Button>

        {/* 대회 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`relative overflow-hidden rounded-2xl border p-6 ${
            isActive
              ? "border-emerald-500/25 bg-gradient-to-br from-emerald-950/20 via-card to-card"
              : "border-border/30 bg-card"
          }`}
        >
          {isActive && <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.06),transparent_60%)]" />}
          <div className="relative space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={competition.status} />
              <DdayBadge endDate={competition.endDate} status={competition.status} />
            </div>
            <h1 className="text-2xl font-black text-foreground leading-snug">{competition.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {competition.startDate} ~ {competition.endDate}
              </span>
              {competition.teamCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {competition.teamCount}개 팀
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* 팀 목록 (PROCEEDING / READY만) */}
        {teams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-border/30 bg-card p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">참여 팀</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/20 p-3"
                  style={{ borderLeftColor: team.colorCode ?? undefined, borderLeftWidth: team.colorCode ? 3 : undefined }}
                >
                  {team.colorCode && (
                    <div className="h-4 w-4 rounded-full shrink-0" style={{ background: team.colorCode, boxShadow: `0 0 8px ${team.colorCode}66` }} />
                  )}
                  <span className="text-sm font-semibold text-foreground truncate">{team.teamName}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 진행 중 대회 → 랭킹 바로가기 */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Button
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/ranking")}
            >
              <Trophy className="h-4 w-4" />
              현재 배틀 순위 보기
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
