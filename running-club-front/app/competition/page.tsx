"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getCompetitionBattle } from "@/lib/api";
import type { CompetitionBattle, TeamBattleItem, GroupContribution } from "@/lib/types";
import { Trophy, Zap, Calendar, Users, Gift } from "lucide-react";

// ── 스켈레톤 컴포넌트 ────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/5 ${className ?? ""}`} />
  );
}

function BattleSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  );
}

// ── D-Day 뱃지 ───────────────────────────────────────────────
function DdayBadge({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining < 0) {
    return (
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-muted-foreground">
        대회 종료
      </span>
    );
  }
  if (daysRemaining === 0) {
    return (
      <span className="rounded-full bg-destructive/20 px-3 py-1 text-xs font-bold text-destructive animate-pulse">
        D-DAY
      </span>
    );
  }
  return (
    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
      D-{daysRemaining}
    </span>
  );
}

// ── 팀 배틀 바 ──────────────────────────────────────────────
function TeamBattleBar({ teams }: { teams: TeamBattleItem[] }) {
  if (teams.length === 0) return null;

  const total = teams.reduce((s, t) => s + (t.totalKm ?? 0), 0);
  const winner = teams[0];
  const loser  = teams[1];

  // 두 팀 모두 0이면 50/50
  const winnerPct = total > 0 ? (winner.totalKm / total) * 100 : 50;
  const loserPct  = 100 - winnerPct;

  const gap = winner.totalKm - (loser?.totalKm ?? 0);

  return (
    <div className="space-y-5">
      {/* 팀 이름 + km */}
      <div className="flex items-end justify-between">
        {/* 1위 팀 */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ background: winner.colorCode ?? "#8B5CF6" }}
            />
            <span className="text-sm font-bold text-foreground">{winner.teamName}</span>
            <span className="text-[10px] rounded-full bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 font-bold">
              👑 1위
            </span>
          </div>
          <span
            className="text-2xl font-black tabular-nums"
            style={{ color: winner.colorCode ?? "#8B5CF6" }}
          >
            {winner.totalKm.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground ml-1">km</span>
          </span>
        </div>

        {/* 격차 */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground font-medium">VS</span>
          {gap > 0 && (
            <span className="text-xs text-muted-foreground mt-1">
              {gap.toFixed(1)}km 차
            </span>
          )}
        </div>

        {/* 2위 팀 */}
        {loser && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">{loser.teamName}</span>
              <div
                className="h-3 w-3 rounded-full"
                style={{ background: loser.colorCode ?? "#6B7280" }}
              />
            </div>
            <span
              className="text-2xl font-black tabular-nums"
              style={{ color: loser.colorCode ?? "#6B7280" }}
            >
              {loser.totalKm.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">km</span>
            </span>
          </div>
        )}
      </div>

      {/* 배틀 게이지 바 */}
      <div className="relative h-5 w-full overflow-hidden rounded-full bg-white/5">
        {/* 1위 팀 바 */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-l-full"
          style={{
            background: `linear-gradient(90deg, ${winner.colorCode ?? "#8B5CF6"}, ${winner.colorCode ?? "#8B5CF6"}bb)`,
            boxShadow: `0 0 12px ${winner.colorCode ?? "#8B5CF6"}66`,
          }}
          initial={{ width: "50%" }}
          animate={{ width: `${winnerPct}%` }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
        />
        {/* 2위 팀 바 */}
        {loser && (
          <motion.div
            className="absolute right-0 top-0 h-full rounded-r-full"
            style={{
              background: `linear-gradient(270deg, ${loser.colorCode ?? "#6B7280"}, ${loser.colorCode ?? "#6B7280"}bb)`,
            }}
            initial={{ width: "50%" }}
            animate={{ width: `${loserPct}%` }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
          />
        )}
        {/* 중앙 구분선 */}
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-background/60 -translate-x-1/2" />
      </div>

      {/* 퍼센트 */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span style={{ color: winner.colorCode ?? "#8B5CF6" }}>
          {winnerPct.toFixed(1)}%
        </span>
        {loser && (
          <span style={{ color: loser.colorCode ?? "#6B7280" }}>
            {loserPct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── 조 기여도 행 ────────────────────────────────────────────
function GroupRow({ group, maxKm, idx }: { group: GroupContribution; maxKm: number; idx: number }) {
  const pct = maxKm > 0 ? (group.totalKm / maxKm) * 100 : 0;
  const color = group.teamColorCode ?? "#8B5CF6";
  const rankColors: Record<number, string> = {
    1: "from-yellow-400 to-yellow-600",
    2: "from-slate-300 to-slate-500",
    3: "from-amber-600 to-amber-800",
  };

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + idx * 0.06 }}
    >
      {/* 순위 */}
      <div className="w-7 shrink-0 text-center">
        {group.rank <= 3 ? (
          <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b ${rankColors[group.rank]} text-[10px] font-black text-white`}>
            {group.rank}
          </div>
        ) : (
          <span className="text-sm font-bold text-muted-foreground">{group.rank}</span>
        )}
      </div>

      {/* 팀 컬러 도트 + 조 이름 */}
      <div className="w-24 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{group.groupName}</div>
            <div className="text-[10px] text-muted-foreground truncate">{group.teamName}</div>
          </div>
        </div>
      </div>

      {/* 바 */}
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
            boxShadow: group.topContributor ? `0 0 8px ${color}88` : undefined,
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 + idx * 0.06 }}
        />
      </div>

      {/* km */}
      <div className="w-16 shrink-0 text-right">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {group.totalKm.toFixed(1)}
        </span>
        <span className="text-[10px] text-muted-foreground ml-0.5">km</span>
        {group.topContributor && (
          <div className="text-[9px] text-yellow-400 font-bold">🎁 선물</div>
        )}
      </div>
    </motion.div>
  );
}

// ── 메인 페이지 ─────────────────────────────────────────────
export default function CompetitionPage() {
  const router = useRouter();
  const [data, setData] = useState<CompetitionBattle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCompetitionBattle()
      .then(setData)
      .catch((err) => {
        if (err.message?.includes("401") || err.message === "UNAUTHORIZED") {
          router.replace("/login");
        } else {
          setError(err.message ?? "대회 정보를 불러오지 못했습니다.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BattleSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <Zap className="h-10 w-10 mx-auto text-white/20" />
          <p className="text-sm text-muted-foreground">{error ?? "현재 진행 중인 대회가 없습니다."}</p>
        </div>
      </div>
    );
  }

  const winner = data.teams[0];
  const maxGroupKm = data.groupRankings[0]?.totalKm ?? 1;

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">

        {/* ── 1. 대회 헤더 배너 ──────────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-white/5 bg-card p-5 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  Live Battle
                </span>
              </div>
              <h1 className="text-lg font-black text-foreground leading-tight">
                {data.title}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {data.endDate} 종료
              </p>
            </div>
            <DdayBadge daysRemaining={data.daysRemaining} />
          </div>

          {/* 인센티브 배너 */}
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-yellow-500/5 border border-yellow-500/20 px-3 py-2">
            <Gift className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
            <p className="text-xs text-yellow-300/80">
              <span className="font-bold text-yellow-400">이긴 팀 전체</span>
              {" + "}
              <span className="font-bold text-yellow-400">기여도 1위 조</span>
              에게 선물이 지급됩니다
            </p>
          </div>
        </motion.div>

        {/* ── 2. 팀 배틀 바 ──────────────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-white/5 bg-card p-5 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">
              Team Battle
            </h2>
          </div>

          <TeamBattleBar teams={data.teams} />

          {/* 현재 리드 문구 */}
          {winner && winner.totalKm > 0 && (
            <motion.p
              className="mt-4 text-center text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              <span style={{ color: winner.colorCode ?? "#8B5CF6" }} className="font-bold">
                {winner.teamName}
              </span>
              {data.teams.length > 1 && data.teams[1].totalKm < winner.totalKm ? (
                <span className="text-muted-foreground">
                  이 {(winner.totalKm - data.teams[1].totalKm).toFixed(1)}km 앞서고 있습니다
                </span>
              ) : (
                <span className="text-muted-foreground">이 현재 동률입니다</span>
              )}
            </motion.p>
          )}
        </motion.div>

        {/* ── 3. 조별 기여도 랭킹 ───────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-white/5 bg-card shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">
                조별 기여도
              </h2>
            </div>
            <span className="text-[10px] text-yellow-400 bg-yellow-500/10 rounded-full px-2 py-0.5 font-bold">
              🎁 1위 조에게 선물
            </span>
          </div>

          <div className="px-5 pb-5 space-y-3">
            {data.groupRankings.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="h-8 w-8 mx-auto text-white/20 mb-2" />
                <p className="text-sm text-muted-foreground">아직 기록된 데이터가 없습니다.</p>
              </div>
            ) : (
              data.groupRankings.map((group, idx) => (
                <GroupRow
                  key={group.groupId}
                  group={group}
                  maxKm={maxGroupKm}
                  idx={idx}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* ── 4. 오늘의 MVP ──────────────────────────────────── */}
        {data.todayMvp && (
          <motion.div
            className="rounded-2xl border border-white/5 bg-card p-5 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-yellow-400" />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">
                오늘의 MVP
              </h2>
              <span className="text-xs text-muted-foreground ml-auto">당일 최고 누적 거리</span>
            </div>

            <div className="flex items-center gap-4">
              {/* 아바타 */}
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${data.todayMvp.teamColorCode ?? "#F59E0B"}, ${data.todayMvp.teamColorCode ?? "#F59E0B"}88)`,
                  boxShadow: `0 4px 20px ${data.todayMvp.teamColorCode ?? "#F59E0B"}44`,
                }}
              >
                {data.todayMvp.name.slice(0, 1)}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black text-foreground">{data.todayMvp.name}</span>
                  {data.todayMvp.teamName && (
                    <span
                      className="text-xs rounded-full px-2 py-0.5 font-semibold"
                      style={{
                        background: (data.todayMvp.teamColorCode ?? "#F59E0B") + "22",
                        color: data.todayMvp.teamColorCode ?? "#F59E0B",
                      }}
                    >
                      {data.todayMvp.teamName}
                    </span>
                  )}
                  {data.todayMvp.groupName && (
                    <span className="text-xs text-muted-foreground">{data.todayMvp.groupName}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">오늘 가장 많이 달렸습니다</p>
              </div>

              {/* 오늘 km */}
              <div className="text-right shrink-0">
                <div
                  className="text-2xl font-black tabular-nums"
                  style={{ color: data.todayMvp.teamColorCode ?? "#F59E0B" }}
                >
                  {data.todayMvp.todayKm.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">km today</div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
