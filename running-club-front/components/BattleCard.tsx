"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Swords, Trophy, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { CompetitionBattle, TeamBattleItem } from "@/lib/types";

// ── Count-up 숫자 애니메이션 ─────────────────────────────────
function CountUp({
  value,
  decimals = 1,
  duration = 1400,
  delay = 400,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  delay?: number;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let raf: number;
    const timer = setTimeout(() => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(value * eased);
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [value, duration, delay]);

  return <>{current.toFixed(decimals)}</>;
}

// ── D-Day 네온 배지 (PROCEEDING 전용) ───────────────────────
function DdayNeonBadge({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining < 0)
    return (
      <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-muted-foreground">
        대회 종료
      </span>
    );
  if (daysRemaining === 0)
    return (
      <motion.span
        className="rounded-full px-3 py-1 text-[10px] font-black text-red-400"
        style={{
          background: "rgba(239,68,68,0.12)",
          boxShadow: "0 0 14px rgba(239,68,68,0.45), inset 0 0 8px rgba(239,68,68,0.08)",
        }}
        animate={{ opacity: [1, 0.55, 1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
      >
        🔴 D-DAY
      </motion.span>
    );
  return (
    <span
      className="rounded-full px-3 py-1 text-[10px] font-black"
      style={{
        background: "rgba(99,102,241,0.12)",
        color: "#818cf8",
        boxShadow: "0 0 12px rgba(99,102,241,0.35), inset 0 0 6px rgba(99,102,241,0.08)",
      }}
    >
      <Trophy className="inline h-2.5 w-2.5 mr-1 -mt-px text-yellow-400" />
      D-{daysRemaining}
    </span>
  );
}

// ── LIVE 배지 (방송 스타일 레이더 펄스) ──────────────────────
function LiveBadge() {
  return (
    <motion.div
      className="flex items-center gap-2 rounded-full px-2.5 py-1"
      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
      animate={{
        boxShadow: [
          "0 0 6px rgba(239,68,68,0.2)",
          "0 0 18px rgba(239,68,68,0.5)",
          "0 0 6px rgba(239,68,68,0.2)",
        ],
      }}
      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
    >
      {/* 레이더 펄스 점 */}
      <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
        <motion.div
          className="absolute rounded-full bg-red-500"
          style={{ width: 7, height: 7 }}
          animate={{ scale: [1, 3], opacity: [0.7, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
        />
        <motion.div
          className="absolute rounded-full bg-red-400"
          style={{ width: 7, height: 7 }}
          animate={{ scale: [1, 3], opacity: [0.5, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut", delay: 0.55 }}
        />
        <div className="w-2 h-2 rounded-full bg-red-500 relative z-10" />
      </div>
      <span className="text-[10px] font-black tracking-widest text-red-400">
        진행중
      </span>
    </motion.div>
  );
}

// ── Coming Soon 카드 ─────────────────────────────────────────
function ComingSoonCard({ data }: { data: CompetitionBattle }) {
  const color1 = data.teams[0]?.colorCode ?? "#6366f1";
  const color2 = data.teams[1]?.colorCode ?? "#94a3b8";

  return (
    <Link href="/competition">
      <motion.div
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        style={{ border: "1px solid rgba(167,139,250,0.15)" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        whileHover={{ scale: 1.012, transition: { duration: 0.12 } }}
        whileTap={{ scale: 0.985 }}
      >
        {/* 배경 글로우 — 숨쉬듯 pulse */}
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.07, 0.15, 0.07] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(ellipse at 20% 50%, ${color1} 0%, transparent 55%),
                         radial-gradient(ellipse at 80% 50%, ${color2} 0%, transparent 55%)`,
          }}
        />

        {/* 상단 스캔라인 */}
        <motion.div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${color1}99 40%, ${color2}99 60%, transparent 100%)`,
          }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.8 }}
        />

        <div className="relative bg-card p-5 space-y-4">
          {/* ── 헤더 ── */}
          <div className="flex items-center justify-between">
            {/* COMING SOON 배지 — 반짝임 */}
            <div className="flex items-center gap-1.5">
              <motion.span
                className="text-violet-300"
                style={{ fontSize: 9 }}
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0 }}
              >
                ✦
              </motion.span>
              <motion.span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: "#a78bfa" }}
                animate={{ opacity: [0.65, 1, 0.65] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                Coming Soon
              </motion.span>
              <motion.span
                className="text-violet-300"
                style={{ fontSize: 9 }}
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              >
                ✦
              </motion.span>
            </div>

            {/* 시작까지 D-Day 배지 */}
            <motion.span
              className="rounded-full px-3 py-1 text-[10px] font-black"
              style={{
                background: "rgba(167,139,250,0.12)",
                color: "#c4b5fd",
                border: "1px solid rgba(167,139,250,0.25)",
              }}
              animate={{
                boxShadow: [
                  "0 0 6px rgba(167,139,250,0.15)",
                  "0 0 18px rgba(167,139,250,0.45)",
                  "0 0 6px rgba(167,139,250,0.15)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            >
              {data.daysUntilStart === 0 ? "🚀 오늘 시작!" : `⏳ D-${data.daysUntilStart}`}
            </motion.span>
          </div>

          {/* 대회명 */}
          <p className="text-sm font-bold text-foreground leading-tight -mt-1">
            {data.title}
          </p>

          {/* 팀 VS 프리뷰 */}
          {data.teams.length >= 2 ? (
            <div className="flex items-center gap-2">
              {/* 팀 1 */}
              <div className="flex-1 min-w-0">
                <motion.div
                  className="flex items-center gap-1.5"
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ repeat: Infinity, duration: 2.4, delay: 0 }}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: color1, boxShadow: `0 0 7px ${color1}` }}
                  />
                  <span className="text-xs font-bold truncate" style={{ color: `${color1}cc` }}>
                    {data.teams[0].teamName}
                  </span>
                </motion.div>
              </div>

              {/* VS */}
              <motion.div
                className="shrink-0 flex flex-col items-center px-1"
                animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.55, 0.25] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              >
                <Swords className="h-4 w-4 text-white/20" />
                <span className="text-[8px] font-black tracking-widest text-white/20">VS</span>
              </motion.div>

              {/* 팀 2 */}
              <div className="flex-1 min-w-0 text-right">
                <motion.div
                  className="flex items-center justify-end gap-1.5"
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ repeat: Infinity, duration: 2.4, delay: 1.2 }}
                >
                  <span className="text-xs font-bold truncate" style={{ color: `${color2}cc` }}>
                    {data.teams[1].teamName}
                  </span>
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: color2, boxShadow: `0 0 7px ${color2}` }}
                  />
                </motion.div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">팀 구성 준비 중...</p>
          )}

          {/* 잠금 게이지 바 */}
          <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="absolute left-0 top-0 h-full w-1/2 rounded-l-full"
              style={{ background: `linear-gradient(90deg, ${color1}55, ${color1}22)` }}
              animate={{ opacity: [0.35, 0.65, 0.35] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
            />
            <motion.div
              className="absolute right-0 top-0 h-full w-1/2 rounded-r-full"
              style={{ background: `linear-gradient(270deg, ${color2}55, ${color2}22)` }}
              animate={{ opacity: [0.35, 0.65, 0.35] }}
              transition={{ repeat: Infinity, duration: 2.4, delay: 1.2 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                className="text-[9px] font-black tracking-widest text-white/35"
                animate={{ opacity: [0.35, 0.75, 0.35] }}
                transition={{ repeat: Infinity, duration: 2.4 }}
              >
                🔒 준비 중
              </motion.span>
            </div>
          </div>

          {/* 시작일 안내 */}
          <motion.p
            className="text-[11px] text-muted-foreground text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            🗓️ {data.startDate} 대회 시작 예정
          </motion.p>

          <div className="flex items-center justify-center gap-0.5 text-[11px] font-semibold text-primary/50">
            <span>자세히 보기</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
export function BattleCard({ data }: { data: CompetitionBattle | null }) {
  if (!data) return null;

  // READY 상태 → Coming Soon 카드
  if (data.status === "READY") return <ComingSoonCard data={data} />;

  // PROCEEDING 이지만 팀이 2개 미만이면 렌더 안 함
  if (data.teams.length < 2) return null;

  // 누적 거리 내림차순 정렬 → [0]=리더, [1]=추격자
  const sorted = [...data.teams].sort((a, b) => b.totalKm - a.totalKm);
  const [leader, trailer] = sorted;

  const total = leader.totalKm + trailer.totalKm;
  const leaderPct  = total > 0 ? (leader.totalKm  / total) * 100 : 50;
  const trailerPct = 100 - leaderPct;

  const leaderColor  = leader.colorCode  ?? "#6366f1";
  const trailerColor = trailer.colorCode ?? "#94a3b8";

  return (
    <Link href="/competition">
      <motion.div
        className="relative rounded-2xl border border-white/5 bg-card overflow-hidden cursor-pointer"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        whileHover={{ scale: 1.012, transition: { duration: 0.12 } }}
        whileTap={{ scale: 0.985 }}
      >
        {/* 배경 엠비언트 글로우 */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            background: `radial-gradient(ellipse at 15% 50%, ${leaderColor} 0%, transparent 55%),
                         radial-gradient(ellipse at 85% 50%, ${trailerColor} 0%, transparent 55%)`,
          }}
        />

        <div className="relative p-5 space-y-4">
          {/* ── 헤더: LIVE 배지 + D-Day ── */}
          <div className="flex items-center justify-between">
            <LiveBadge />
            <DdayNeonBadge daysRemaining={data.daysRemaining} />
          </div>

          {/* 대회명 */}
          <p className="text-sm font-bold text-foreground leading-tight -mt-1">
            {data.title}
          </p>

          {/* ── VS 섹션 ── */}
          <div className="flex items-center gap-2">
            {/* 리더 팀 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: leaderColor, boxShadow: `0 0 6px ${leaderColor}` }}
                />
                <span className="text-xs font-bold text-foreground truncate">
                  {leader.teamName}
                </span>
                <span className="text-[9px] bg-yellow-500/15 text-yellow-400 rounded-full px-1.5 py-px font-black shrink-0">
                  👑
                </span>
              </div>
              <div>
                <span
                  className="text-[1.6rem] font-black tabular-nums leading-none"
                  style={{ color: leaderColor, textShadow: `0 0 18px ${leaderColor}66` }}
                >
                  <CountUp value={leader.totalKm} delay={350} />
                </span>
                <span className="text-xs text-muted-foreground ml-1">km</span>
              </div>
            </div>

            {/* 중앙 — 칼 아이콘 */}
            <motion.div
              className="shrink-0 flex flex-col items-center gap-0.5 px-1"
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            >
              <Swords className="h-5 w-5 text-white/25" />
              <span className="text-[8px] font-black tracking-widest text-white/20">VS</span>
            </motion.div>

            {/* 추격자 팀 */}
            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center justify-end gap-1.5 mb-1.5">
                <span className="text-xs font-bold text-foreground truncate">
                  {trailer.teamName}
                </span>
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: trailerColor }}
                />
              </div>
              <div>
                <span
                  className="text-[1.6rem] font-black tabular-nums leading-none"
                  style={{ color: trailerColor }}
                >
                  <CountUp value={trailer.totalKm} delay={350} />
                </span>
                <span className="text-xs text-muted-foreground ml-1">km</span>
              </div>
            </div>
          </div>

          {/* ── 배틀 게이지 바 ── */}
          <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-l-full"
              style={{
                background: `linear-gradient(90deg, ${leaderColor}dd, ${leaderColor}88)`,
                boxShadow: `0 0 10px ${leaderColor}66`,
              }}
              initial={{ width: "50%" }}
              animate={{ width: `${leaderPct}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            />
            <motion.div
              className="absolute right-0 top-0 h-full rounded-r-full"
              style={{
                background: `linear-gradient(270deg, ${trailerColor}dd, ${trailerColor}88)`,
              }}
              initial={{ width: "50%" }}
              animate={{ width: `${trailerPct}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            />
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-background/70 z-10" />
          </div>

          {/* 퍼센트 */}
          <div className="flex justify-between text-[10px] font-bold -mt-2 px-0.5">
            <span style={{ color: leaderColor }}>{leaderPct.toFixed(1)}%</span>
            <span style={{ color: trailerColor }}>{trailerPct.toFixed(1)}%</span>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-center gap-0.5 text-[11px] font-semibold text-primary/50">
            <span>자세히 보기</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
