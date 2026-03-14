"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AuthUser, RankingItem } from "@/lib/types";
import { getGroupRanking } from "@/lib/api";

interface Props {
  user: AuthUser;
  onDone: () => void;
}

/**
 * 로그인 성공 직후 3초간 전면 환영 애니메이션.
 *
 * 팀 테마:
 *  - 청팀 (#3B82F6) → 블루 네온
 *  - 홍팀 (#EF4444) → 레드 네온
 *  - 백팀            → 화이트/실버 네온
 *  - 기타            → 퍼플 네온
 */
export default function WelcomeOverlay({ user, onDone }: Props) {
  const [groupStatus, setGroupStatus] = useState<string | null>(null);

  const theme = getTeamTheme(user.teamName, user.teamColorCode);

  // 조 랭킹 조회 → 1위까지 거리 계산
  useEffect(() => {
    if (!user.groupId) {
      setGroupStatus("오늘도 함께 달려봐요! 🏃");
      return;
    }
    getGroupRanking()
      .then((rankings: RankingItem[]) => {
        const myRank = rankings.find((r) => r.entityId === user.groupId);
        const first = rankings[0];
        if (!myRank || !first) {
          setGroupStatus("오늘도 함께 달려봐요! 🏃");
          return;
        }
        if (myRank.rank === 1) {
          setGroupStatus(`[${user.groupName}] 현재 조별 1위! 선두를 지켜나가요! 🥇`);
        } else {
          const gap = (first.totalDistance - myRank.totalDistance).toFixed(1);
          setGroupStatus(
            `[${user.groupName}] 멤버들과 함께 달리는 중! 조별 1위까지 단 ${gap}km 남았습니다! 💪`
          );
        }
      })
      .catch(() => setGroupStatus("오늘도 함께 달려봐요! 🏃"));
  }, [user.groupId, user.groupName]);

  // 3초 후 자동 종료
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const teamLabel = user.teamName ?? "러닝 클럽";

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-overlay"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: theme.background }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onDone}
      >
        {/* 네온 글로우 배경 원형 */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            background: `radial-gradient(circle, ${theme.glow}33 0%, transparent 70%)`,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.4, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* 팀 이름 배지 */}
        <motion.div
          className="mb-6 rounded-full border px-5 py-1.5 text-sm font-semibold tracking-widest uppercase"
          style={{
            borderColor: theme.glow,
            color: theme.glow,
            boxShadow: `0 0 12px ${theme.glow}88`,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {teamLabel}
        </motion.div>

        {/* 메인 환영 메시지 */}
        <motion.h1
          className="relative z-10 text-center text-4xl font-black tracking-tight text-white sm:text-5xl"
          style={{ textShadow: `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}88` }}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "backOut" }}
        >
          환영합니다,{" "}
          <span style={{ color: theme.accent }}>
            {user.name}
          </span>
          님!
        </motion.h1>

        {/* 서브 메시지 */}
        <motion.p
          className="relative z-10 mt-3 text-center text-lg font-medium"
          style={{ color: theme.accent }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          오늘 {teamLabel}의 하늘은 맑음입니다! {theme.emoji}
        </motion.p>

        {/* 조 상태 요약 */}
        {groupStatus && (
          <motion.p
            className="relative z-10 mt-6 max-w-xs text-center text-sm text-white/70"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
          >
            {groupStatus}
          </motion.p>
        )}

        {/* 진행바 */}
        <motion.div
          className="absolute bottom-0 left-0 h-1"
          style={{ background: theme.glow, boxShadow: `0 0 8px ${theme.glow}` }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "linear" }}
        />

        {/* 클릭 힌트 */}
        <motion.p
          className="absolute bottom-6 text-xs text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          클릭하면 바로 이동합니다
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}

// ── 팀별 테마 계산 ────────────────────────────────────────────────────────────

function getTeamTheme(teamName: string | null, colorCode: string | null) {
  // 청팀 판별: colorCode 우선, teamName 폴백
  const isBlue = colorCode === "#3B82F6" || teamName === "청팀";
  const isRed  = colorCode === "#EF4444" || teamName === "홍팀";
  const isWhite = teamName === "백팀";

  if (isBlue) return {
    background: "linear-gradient(135deg, #020c1b 0%, #0a1628 50%, #020c1b 100%)",
    glow: "#3B82F6",
    accent: "#93C5FD",
    emoji: "💙",
  };
  if (isRed) return {
    background: "linear-gradient(135deg, #1a0000 0%, #2d0505 50%, #1a0000 100%)",
    glow: "#EF4444",
    accent: "#FCA5A5",
    emoji: "❤️",
  };
  if (isWhite) return {
    background: "linear-gradient(135deg, #0f1117 0%, #1e2230 50%, #0f1117 100%)",
    glow: "#E2E8F0",
    accent: "#F8FAFC",
    emoji: "🤍",
  };
  return {
    background: "linear-gradient(135deg, #0d0617 0%, #1a0a2e 50%, #0d0617 100%)",
    glow: "#8B5CF6",
    accent: "#C4B5FD",
    emoji: "⚡",
  };
}
