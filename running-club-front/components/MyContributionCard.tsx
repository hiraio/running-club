"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flag, Flame, Footprints, Users, TrendingUp, Swords } from "lucide-react";
import type { GroupMemberDTO } from "@/lib/types";

interface MyContributionCardProps {
  teamColor: string;
  groupName: string | null;
  groupMembers: GroupMemberDTO[];
  userId: number;
}

export default function MyContributionCard({
  teamColor,
  groupName,
  groupMembers,
  userId,
}: MyContributionCardProps) {
  const stats = useMemo(() => {
    if (groupMembers.length === 0) return null;

    const sorted = [...groupMembers].sort((a, b) => b.totalDistance - a.totalDistance);
    const me = sorted.find((m) => m.memberId === userId);
    if (!me) return null;

    const groupTotal = sorted.reduce((s, m) => s + m.totalDistance, 0);
    const groupAvg = groupTotal / sorted.length;
    const myRank = sorted.findIndex((m) => m.memberId === userId) + 1;
    const above = myRank > 1 ? sorted[myRank - 2] : null;
    const gap = above ? above.totalDistance - me.totalDistance : 0;
    const contributionPct = groupTotal > 0
      ? (me.totalDistance / groupTotal) * 100
      : 0;
    const vsAvg = me.totalDistance - groupAvg;

    return { me, sorted, groupTotal, groupAvg, myRank, above, gap, contributionPct, vsAvg };
  }, [groupMembers, userId]);

  if (!stats || stats.me.totalDistance === 0) return null;

  const { me, sorted, groupTotal, myRank, gap, contributionPct, vsAvg, above } = stats;
  const teamColorLight = teamColor + "22";
  const teamColorMid = teamColor + "44";

  return (
    <motion.div
      className="rounded-2xl border border-white/5 bg-card p-5 shadow-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12 }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <Swords className="h-4 w-4" style={{ color: teamColor }} />
        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
          조 내 나의 기여도
        </h3>
        {groupName && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold ml-1"
            style={{ background: teamColorLight, color: teamColor }}
          >
            {groupName}
          </span>
        )}
      </div>

      {/* 핵심 지표 3개 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          {
            icon: <Footprints className="h-4 w-4" />,
            label: "내 기여 거리",
            value: me.totalDistance.toFixed(1),
            unit: "km",
          },
          {
            icon: <Flag className="h-4 w-4" />,
            label: "조 내 순위",
            value: `${myRank}위`,
            unit: `/ ${sorted.length}명`,
          },
          {
            icon: <Flame className="h-4 w-4" />,
            label: "기여 비중",
            value: `${contributionPct.toFixed(1)}%`,
            unit: `조 총 ${groupTotal.toFixed(1)}km`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center rounded-xl p-3 text-center"
            style={{ background: teamColorLight }}
          >
            <div style={{ color: teamColor }}>{stat.icon}</div>
            <div className="mt-1 text-[10px] text-muted-foreground leading-tight">
              {stat.label}
            </div>
            <div className="text-lg font-black text-foreground tabular-nums leading-tight mt-0.5">
              {stat.value}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              {stat.unit}
            </div>
          </div>
        ))}
      </div>

      {/* 기여 비중 프로그레스 바 */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>내 기여 비중</span>
          <span style={{ color: teamColor }}>{contributionPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${teamColor}, ${teamColor}cc)`,
              boxShadow: `0 0 8px ${teamColor}66`,
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(contributionPct, 100)}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>

      {/* 조원 바 그래프 (미니) */}
      <div className="mb-4">
        <div className="flex items-end gap-1.5 h-10">
          {sorted.map((m) => {
            const isMe = m.memberId === userId;
            const maxKm = sorted[0].totalDistance || 1;
            const heightPct = (m.totalDistance / maxKm) * 100;
            return (
              <div key={m.memberId} className="flex-1 flex flex-col items-center gap-0.5">
                <motion.div
                  className="w-full rounded-t"
                  style={{
                    background: isMe ? teamColor : teamColorMid,
                    boxShadow: isMe ? `0 0 8px ${teamColor}88` : undefined,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5 mt-1">
          {sorted.map((m) => {
            const isMe = m.memberId === userId;
            return (
              <div key={m.memberId} className="flex-1 text-center">
                <span
                  className="text-[9px] font-semibold truncate block"
                  style={{ color: isMe ? teamColor : "rgba(255,255,255,0.3)" }}
                >
                  {isMe ? "나" : m.name.slice(0, 1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 조 평균 vs 나 */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3"
        style={{ background: teamColorLight }}
      >
        <TrendingUp className="h-3.5 w-3.5 shrink-0" style={{ color: teamColor }} />
        <span className="text-xs text-foreground/80">
          {vsAvg >= 0 ? (
            <>
              조 평균보다{" "}
              <span className="font-black" style={{ color: teamColor }}>
                +{vsAvg.toFixed(1)}km
              </span>{" "}
              더 뛰고 있어요! 👏
            </>
          ) : (
            <>
              조 평균까지{" "}
              <span className="font-black text-orange-400">
                {Math.abs(vsAvg).toFixed(1)}km
              </span>{" "}
              남았어요. 힘내요! 💪
            </>
          )}
        </span>
      </div>

      {/* 긴장감 문구 — 1위가 아닐 때만 */}
      {above && gap > 0 && (
        <motion.div
          className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
          style={{ borderColor: teamColor + "44", background: teamColor + "0d" }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Flame className="h-3.5 w-3.5 shrink-0" style={{ color: teamColor }} />
          <span className="text-xs text-foreground/80">
            <span className="font-black" style={{ color: teamColor }}>
              {gap.toFixed(1)}km
            </span>
            만 더 뛰면{" "}
            <span className="font-semibold text-foreground">{above.name}</span>
            님을 제치고{" "}
            <span className="font-black" style={{ color: teamColor }}>
              조 {myRank - 1}위
            </span>
            로 올라서요! 🔥
          </span>
        </motion.div>
      )}

      {/* 이미 1위 */}
      {myRank === 1 && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: teamColorLight }}
        >
          <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: teamColor }} />
          <span className="text-xs font-semibold" style={{ color: teamColor }}>
            현재 조 1위! 이 자리를 지켜주세요 🏆
          </span>
        </div>
      )}
    </motion.div>
  );
}
