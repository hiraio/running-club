"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, User, Medal, Crown, ChevronUp, ChevronDown,
  Heart, ChevronDown as ExpandIcon, ChevronUp as CollapseIcon,
  Zap, Calendar, Gift, Users,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RankingItem, CompetitionBattle, GroupContribution } from "@/lib/types";
import { getMemberRanking, getActiveCompetitions, getCompetitionBattle } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import GroupMembersSheet from "@/components/GroupMembersSheet";

const INITIAL_SHOW = 5;

// ── 순위 배지 ────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500"><Medal className="mr-1 h-3 w-3" />1위</Badge>;
  if (rank === 2) return <Badge className="bg-gray-300 text-gray-800 hover:bg-gray-300"><Medal className="mr-1 h-3 w-3" />2위</Badge>;
  if (rank === 3) return <Badge className="bg-amber-600 text-amber-50 hover:bg-amber-600"><Medal className="mr-1 h-3 w-3" />3위</Badge>;
  return <span className="text-muted-foreground font-mono ml-2">{rank}</span>;
}

// ── 순위 변동 ─────────────────────────────────────────────────
function RankChangeIndicator({ change }: { change: number | null | undefined }) {
  if (change === undefined || change === null)
    return <span className="text-[9px] font-black rounded-full px-1.5 py-0.5" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>NEW</span>;
  if (change === 0) return <span className="text-[10px] text-muted-foreground font-bold">—</span>;
  if (change > 0) return <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-400"><ChevronUp className="h-3 w-3" />{change}</span>;
  return <span className="flex items-center gap-0.5 text-[10px] font-black text-red-400"><ChevronDown className="h-3 w-3" />{Math.abs(change)}</span>;
}

function MeBadge() {
  return <span className="text-[10px] font-black rounded-full px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30">나</span>;
}

// ── 개인 랭킹 카드 (모바일) ────────────────────────────────────
function MobileRankCard({ item, isMe, onNameClick }: { item: RankingItem; isMe: boolean; onNameClick: () => void }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border p-3 ${isMe ? "border-blue-500/40 bg-blue-500/10" : item.rank <= 3 ? "border-primary/30 bg-primary/5" : "border-border/30 bg-secondary/30"}`}>
      <div className="flex items-center gap-2">
        <RankBadge rank={item.rank} />
        <RankChangeIndicator change={item.rankChange} />
        <button
          className="font-medium hover:text-primary transition-colors text-left"
          onClick={onNameClick}
        >
          {item.name}
        </button>
        {isMe && <MeBadge />}
      </div>
      <div className="text-right">
        <span className="text-primary font-bold">{item.totalDistance.toFixed(2)}</span>
        <span className="ml-1 text-xs text-muted-foreground">km</span>
      </div>
    </div>
  );
}

// ── 개인 랭킹 (모바일 카드) ──────────────────────────────────
function MemberRankingCards({ data, isLoading, myMemberId, onMemberClick }: { data: RankingItem[]; isLoading: boolean; myMemberId?: number; onMemberClick: (id: number, isMe: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>;
  if (data.length === 0) return <div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><Trophy className="mb-2 h-10 w-10 opacity-50" /><p className="text-sm">데이터 없음</p></div>;

  const visibleData = expanded ? data : data.slice(0, INITIAL_SHOW);
  const myItem = myMemberId ? data.find((r) => r.entityId === myMemberId) : null;
  const myItemHidden = myItem && !visibleData.find((r) => r.entityId === myMemberId);

  return (
    <div className="space-y-2">
      {visibleData.map((item) => {
        const isMe = item.entityId === myMemberId;
        return (
          <MobileRankCard key={item.entityId} item={item} isMe={isMe} onNameClick={() => onMemberClick(item.entityId, isMe)} />
        );
      })}
      {!expanded && myItemHidden && myItem && (
        <>
          <div className="text-center text-xs text-muted-foreground py-0.5">···</div>
          <MobileRankCard item={myItem} isMe={true} onNameClick={() => onMemberClick(myItem.entityId, true)} />
        </>
      )}
      {data.length > INITIAL_SHOW && (
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground gap-1 mt-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? <><CollapseIcon className="h-4 w-4" />접기</> : <><ExpandIcon className="h-4 w-4" />더 보기 ({data.length - INITIAL_SHOW}명 더)</>}
        </Button>
      )}
    </div>
  );
}

// ── 개인 랭킹 (데스크탑 테이블) ──────────────────────────────
function MemberRankingTable({ data, isLoading, myMemberId, onMemberClick }: { data: RankingItem[]; isLoading: boolean; myMemberId?: number; onMemberClick: (id: number, isMe: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  if (data.length === 0) return <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Trophy className="mb-2 h-12 w-12 opacity-50" /><p>아직 랭킹 데이터가 없습니다.</p></div>;

  const visibleData = expanded ? data : data.slice(0, INITIAL_SHOW);
  const myItem = myMemberId ? data.find((r) => r.entityId === myMemberId) : null;
  const myItemHidden = myItem && !visibleData.find((r) => r.entityId === myMemberId);

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-16">순위</TableHead>
            <TableHead className="w-12">변동</TableHead>
            <TableHead>이름</TableHead>
            <TableHead className="text-right">총 거리</TableHead>
            <TableHead className="text-right">기록 수</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleData.map((item) => {
            const isMe = item.entityId === myMemberId;
            return (
              <TableRow key={item.entityId} className={`border-border/30 ${isMe ? "bg-blue-500/10 border-l-2 border-l-blue-500" : item.rank <= 3 ? "bg-primary/5" : ""}`}>
                <TableCell><RankBadge rank={item.rank} /></TableCell>
                <TableCell><RankChangeIndicator change={item.rankChange} /></TableCell>
                <TableCell className="font-medium">
                  <button
                    className="flex items-center gap-2 hover:text-primary transition-colors text-left"
                    onClick={() => onMemberClick(item.entityId, isMe)}
                  >
                    {item.name}{isMe && <MeBadge />}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-primary font-semibold">{item.totalDistance.toFixed(2)}</span>{" "}
                  <span className="text-muted-foreground text-sm">km</span>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{item.recordCount}회</TableCell>
              </TableRow>
            );
          })}
          {!expanded && myItemHidden && myItem && (
            <>
              <TableRow className="border-0"><TableCell colSpan={5} className="py-1 text-center text-xs text-muted-foreground">···</TableCell></TableRow>
              <TableRow className="border-border/30 bg-blue-500/10 border-l-2 border-l-blue-500">
                <TableCell><RankBadge rank={myItem.rank} /></TableCell>
                <TableCell><RankChangeIndicator change={myItem.rankChange} /></TableCell>
                <TableCell className="font-medium">
                  <button
                    className="flex items-center gap-2 hover:text-primary transition-colors text-left"
                    onClick={() => onMemberClick(myItem.entityId, true)}
                  >
                    {myItem.name}<MeBadge />
                  </button>
                </TableCell>
                <TableCell className="text-right"><span className="text-primary font-semibold">{myItem.totalDistance.toFixed(2)}</span><span className="text-muted-foreground text-sm ml-1">km</span></TableCell>
                <TableCell className="text-right text-muted-foreground">{myItem.recordCount}회</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
      {data.length > INITIAL_SHOW && (
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground gap-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? <><CollapseIcon className="h-4 w-4" />접기</> : <><ExpandIcon className="h-4 w-4" />더 보기 ({data.length - INITIAL_SHOW}명 더)</>}
        </Button>
      )}
    </div>
  );
}

// ── D-Day 배지 ───────────────────────────────────────────────
function DdayBadge({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining < 0) return <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-muted-foreground">대회 종료</span>;
  if (daysRemaining === 0) return <span className="rounded-full bg-destructive/20 px-3 py-1 text-xs font-bold text-destructive animate-pulse">D-DAY</span>;
  return <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">D-{daysRemaining}</span>;
}

// ── 팀 배틀 바 ───────────────────────────────────────────────
function TeamBattleBar({ battle }: { battle: CompetitionBattle }) {
  const { teams } = battle;
  if (teams.length === 0) return null;

  const total = teams.reduce((s, t) => s + (t.totalKm ?? 0), 0);
  const winner = teams[0];
  const loser = teams[1];
  const winnerPct = total > 0 ? (winner.totalKm / total) * 100 : 50;
  const loserPct = 100 - winnerPct;
  const gap = winner.totalKm - (loser?.totalKm ?? 0);

  return (
    <Card className="border-border/50 bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-black text-primary uppercase tracking-wider">Team Battle</span>
            </div>
            <CardTitle className="text-base font-black">{battle.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />{battle.endDate} 종료
            </p>
          </div>
          <DdayBadge daysRemaining={battle.daysRemaining} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 팀 km */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ background: winner.colorCode ?? "#8B5CF6" }} />
              <span className="text-sm font-bold text-foreground">{winner.teamName}</span>
              <span className="text-[10px] rounded-full bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 font-bold">👑 1위</span>
            </div>
            <span className="text-2xl font-black tabular-nums" style={{ color: winner.colorCode ?? "#8B5CF6" }}>
              {winner.totalKm.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">km</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground font-medium">VS</span>
            {gap > 0 && <span className="text-xs text-muted-foreground mt-1">{gap.toFixed(1)}km 차</span>}
          </div>
          {loser && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">{loser.teamName}</span>
                <div className="h-3 w-3 rounded-full" style={{ background: loser.colorCode ?? "#6B7280" }} />
              </div>
              <span className="text-2xl font-black tabular-nums" style={{ color: loser.colorCode ?? "#6B7280" }}>
                {loser.totalKm.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">km</span>
              </span>
            </div>
          )}
        </div>

        {/* 게이지 바 */}
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div className="absolute left-0 top-0 h-full rounded-l-full"
            style={{ background: `linear-gradient(90deg, ${winner.colorCode ?? "#8B5CF6"}, ${winner.colorCode ?? "#8B5CF6"}bb)`, boxShadow: `0 0 12px ${winner.colorCode ?? "#8B5CF6"}66` }}
            initial={{ width: "50%" }} animate={{ width: `${winnerPct}%` }} transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          />
          {loser && (
            <motion.div className="absolute right-0 top-0 h-full rounded-r-full"
              style={{ background: `linear-gradient(270deg, ${loser.colorCode ?? "#6B7280"}, ${loser.colorCode ?? "#6B7280"}bb)` }}
              initial={{ width: "50%" }} animate={{ width: `${loserPct}%` }} transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
            />
          )}
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-background/60 -translate-x-1/2" />
        </div>
        <div className="flex justify-between text-xs px-1">
          <span style={{ color: winner.colorCode ?? "#8B5CF6" }}>{winnerPct.toFixed(1)}%</span>
          {loser && <span style={{ color: loser.colorCode ?? "#6B7280" }}>{loserPct.toFixed(1)}%</span>}
        </div>

        {/* 인센티브 */}
        <div className="flex items-center gap-2 rounded-xl bg-yellow-500/5 border border-yellow-500/20 px-3 py-2">
          <Gift className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-300/80">
            <span className="font-bold text-yellow-400">이긴 팀 전체</span>{" + "}
            <span className="font-bold text-yellow-400">기여도 1위 조</span>에게 선물이 지급됩니다
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── 선물 티어 배지 ────────────────────────────────────────────
function PrizeTierBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <motion.span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black"
        style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)" }}
        animate={{ boxShadow: ["0 0 6px rgba(234,179,8,0.2)", "0 0 14px rgba(234,179,8,0.5)", "0 0 6px rgba(234,179,8,0.2)"] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
        🎁 프리미엄 선물
      </motion.span>
    );
  if (rank === 2) return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black" style={{ background: "rgba(209,213,219,0.15)", color: "#d1d5db", border: "1px solid rgba(209,213,219,0.3)" }}>🥇 금메달 선물</span>;
  if (rank === 3) return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black" style={{ background: "rgba(180,83,9,0.15)", color: "#d97706", border: "1px solid rgba(180,83,9,0.3)" }}>🥈 은메달 선물</span>;
  return null;
}

// ── 응원 버튼 ────────────────────────────────────────────────
function CheerButton({ groupName }: { groupName: string }) {
  const [cheering, setCheering] = useState(false);
  const [sparks, setSparks] = useState<number[]>([]);

  const handleCheer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cheering) return;
    setCheering(true);
    setSparks([...Array(6)].map((_, i) => i));
    setTimeout(() => { setCheering(false); setSparks([]); }, 1800);
  };

  return (
    <div className="relative flex justify-end mt-2">
      <AnimatePresence>
        {sparks.map((i) => (
          <motion.span key={i} className="absolute text-sm pointer-events-none"
            style={{ right: `${8 + i * 14}px`, bottom: 0 }}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -48 - Math.random() * 24, x: (i % 2 === 0 ? 1 : -1) * (8 + i * 4), scale: 1.3 }}
            exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: "easeOut" }}>
            {["🔥", "💪", "⚡", "🏃", "✨", "👏"][i]}
          </motion.span>
        ))}
      </AnimatePresence>
      <motion.button onClick={handleCheer}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
        style={{ background: cheering ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", border: cheering ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)", color: cheering ? "#f87171" : "#94a3b8" }}
        whileTap={{ scale: 0.92 }} animate={cheering ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.3 }}>
        <Heart className={`h-3 w-3 ${cheering ? "fill-red-400 text-red-400" : ""}`} />
        {cheering ? `${groupName} 화이팅!` : "우리 조 응원하기"}
      </motion.button>
    </div>
  );
}

// ── 조별 기여도 카드 ──────────────────────────────────────────
function GroupContributionCard({ group, isWinningTeam, maxKm, index, onGroupClick }: { group: GroupContribution; isWinningTeam: boolean; maxKm: number; index: number; onGroupClick: (groupId: number, groupName: string, colorCode: string | null) => void }) {
  const color = group.teamColorCode ?? "#6366f1";
  const pct = maxKm > 0 ? (group.totalKm / maxKm) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07, duration: 0.35 }}
      className="relative rounded-2xl overflow-hidden"
      style={{ border: group.rank === 1 ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.06)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `${color}08` }} />
      {group.rank === 1 && (
        <motion.div className="absolute inset-0 pointer-events-none rounded-2xl"
          animate={{ boxShadow: [`0 0 0px ${color}00`, `0 0 20px ${color}33`, `0 0 0px ${color}00`] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} />
      )}
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {group.rank === 1 ? (
              <motion.div animate={{ rotate: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                <Crown className="h-5 w-5 shrink-0" style={{ color: "#fbbf24", filter: "drop-shadow(0 0 6px #fbbf2488)" }} />
              </motion.div>
            ) : (
              <span className="text-sm font-black text-muted-foreground w-5 text-center shrink-0">{group.rank}</span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                <span className="text-sm font-bold text-foreground">{group.teamName} {group.groupName}</span>
                <button
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors shrink-0"
                  onClick={() => onGroupClick(group.groupId, `${group.teamName} ${group.groupName}`, group.teamColorCode)}
                >
                  <Users className="h-2.5 w-2.5" />({group.memberCount}명)
                </button>
                <RankChangeIndicator change={group.rankChange} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">기록 {group.recordCount}건</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <PrizeTierBadge rank={group.rank} />
            {isWinningTeam && (
              <motion.span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-black"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
                animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                🔥 당첨 유력
              </motion.span>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[1.3rem] font-black tabular-nums" style={{ color, textShadow: group.rank === 1 ? `0 0 14px ${color}66` : "none" }}>{group.totalKm.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">km</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}dd, ${color}88)` }}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.0, ease: "easeOut", delay: 0.2 + index * 0.07 }} />
          </div>
        </div>
        <CheerButton groupName={`${group.teamName} ${group.groupName}`} />
      </div>
    </motion.div>
  );
}

// ── 조별 기여도 섹션 ──────────────────────────────────────────
function GroupContributionSection({ battle, loading, onGroupClick }: { battle: CompetitionBattle | null; loading: boolean; onGroupClick: (groupId: number, groupName: string, colorCode: string | null) => void }) {
  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}</div>;
  if (!battle || battle.groupRankings.length === 0)
    return <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Trophy className="mb-2 h-12 w-12 opacity-50" /><p>기여도 데이터가 없습니다.</p></div>;

  const sortedTeams = [...battle.teams].sort((a, b) => b.totalKm - a.totalKm);
  const winningTeamId = sortedTeams.length >= 2 && sortedTeams[0].totalKm > sortedTeams[1].totalKm ? sortedTeams[0].id : null;
  const maxKm = battle.groupRankings[0]?.totalKm ?? 1;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xl">🏃</div>
        <div className="flex-1">
          <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1">NDy 가이드</p>
          <p className="text-sm text-foreground/80 leading-relaxed">이긴 팀 중에서 더 많이 뛴 조가 더 큰 선물을 가져가요! 🏃‍♂️💨</p>
        </div>
      </motion.div>
      <div className="space-y-3">
        {battle.groupRankings.map((group, i) => (
          <GroupContributionCard key={group.groupId} group={group}
            isWinningTeam={winningTeamId !== null && group.teamId === winningTeamId}
            maxKm={maxKm} index={i} onGroupClick={onGroupClick} />
        ))}
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function RankingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(true);
  const [battle, setBattle] = useState<CompetitionBattle | null>(null);
  const [isBattleLoading, setIsBattleLoading] = useState(true);

  // 조 멤버 Sheet 상태
  const [selectedGroup, setSelectedGroup] = useState<{ groupId: number; groupName: string; colorCode: string | null } | null>(null);

  const myMemberId = user?.id;

  const handleMemberClick = (memberId: number, isMe: boolean) => {
    if (isMe) { router.push("/dashboard"); return; }
    router.push(`/members/${memberId}`);
  };

  const handleGroupClick = (groupId: number, groupName: string, colorCode: string | null) => {
    setSelectedGroup({ groupId, groupName, colorCode });
  };

  useEffect(() => {
    // 배틀 데이터 fetch
    getCompetitionBattle().then(setBattle).catch(() => {}).finally(() => setIsBattleLoading(false));

    // 활성 대회 ID를 먼저 조회 → 해당 대회 기준으로 개인 순위 fetch (rankChange 포함)
    // competitionId 없이 호출하면 백엔드에서 rankChange를 주입하지 않음
    getActiveCompetitions()
      .then((res) => {
        const activeId = res.success && res.data.length > 0 ? res.data[0].id : undefined;
        return getMemberRanking(activeId);
      })
      .then(setRankings)
      .finally(() => setIsRankingLoading(false));
  }, []);

  return (
    <>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* ── 1. 개인 순위 ── */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />개인 순위
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="md:hidden">
                <MemberRankingCards data={rankings} isLoading={isRankingLoading} myMemberId={myMemberId} onMemberClick={handleMemberClick} />
              </div>
              <div className="hidden md:block">
                <MemberRankingTable data={rankings} isLoading={isRankingLoading} myMemberId={myMemberId} onMemberClick={handleMemberClick} />
              </div>
            </CardContent>
          </Card>

          {/* ── 2. 팀 배틀 현황 ── */}
          {isBattleLoading ? (
            <Skeleton className="h-52 w-full rounded-2xl" />
          ) : battle ? (
            <TeamBattleBar battle={battle} />
          ) : null}

          {/* ── 3. 조별 기여도 ── */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-primary" />조별 기여도
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GroupContributionSection battle={battle} loading={isBattleLoading} onGroupClick={handleGroupClick} />
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── 조 멤버 Sheet ── */}
      <GroupMembersSheet
        groupId={selectedGroup?.groupId ?? null}
        groupName={selectedGroup?.groupName}
        teamColorCode={selectedGroup?.colorCode}
        myMemberId={myMemberId}
        onClose={() => setSelectedGroup(null)}
        onSelectMember={(memberId) => {
          setSelectedGroup(null);
          router.push(`/members/${memberId}`);
        }}
      />
    </>
  );
}
