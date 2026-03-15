"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { getMyDashboard } from "@/lib/api";
import type { AuthUser, CompetitionBattle, MemberDashboardData } from "@/lib/types";

interface Props {
  battleData: CompetitionBattle | null;
}

// ── 한국어 조사 ───────────────────────────────────────────────
function josa(word: string, type: "이/가" | "와/과"): string {
  const code = word.charCodeAt(word.length - 1);
  const hasBatchim = code >= 0xAC00 && (code - 0xAC00) % 28 !== 0;
  if (type === "이/가") return word + (hasBatchim ? "이" : "가");
  return word + (hasBatchim ? "과" : "와");
}

// ── 숫자 볼드 렌더러 ──────────────────────────────────────────
function BoldNumbers({ text, color }: { text: string; color?: string }) {
  const parts = text.split(/(\d+\.?\d*(?:km|위|%)?)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\d+\.?\d*(km|위|%)?$/.test(part) ? (
          <strong key={i} className="font-black" style={{ color: color ?? "#fff" }}>
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ── 메시지 목록 생성 ──────────────────────────────────────────
function computeMessages(
  user: AuthUser,
  battleData: CompetitionBattle | null,
  dashboard: MemberDashboardData
): string[] {
  const { name, teamId, teamName } = user;
  const { ranToday, memberRank, currentDistance } = dashboard;

  const hour = new Date().getHours();
  const timeGreet =
    hour < 12 ? "좋은 아침이에요" :
    hour < 18 ? "안녕하세요" : "수고했어요";

  // 팀 미배정
  if (!teamId) {
    const msgs = [`${timeGreet}, ${name}님! 오늘도 달려봐요 🏃`];
    if (ranToday) msgs.push(`오늘 기록 등록 완료! 승인 대기 중이에요 ⏳`);
    if (memberRank > 0) msgs.push(`현재 개인 ${memberRank}위! 계속 달려요 💪`);
    if (currentDistance > 0) msgs.push(`지금까지 총 ${currentDistance.toFixed(1)}km 달렸어요 🎉`);
    return msgs;
  }

  // 대회 없거나 READY
  if (!battleData || battleData.status === "READY") {
    const msgs = [
      `${timeGreet}, ${name}님! 오늘도 화이팅 🔥`,
      ranToday ? `오늘 달리셨군요! 최고예요 👏` : `오늘 가볍게 1km만 달려볼까요? 🏃`,
    ];
    if (memberRank > 0) msgs.push(`현재 개인 ${memberRank}위예요, ${name}님!`);
    return msgs;
  }

  // 대회 진행 중
  const sorted = [...battleData.teams].sort((a, b) => b.totalKm - a.totalKm);
  const myIdx = sorted.findIndex((t) => t.id === teamId);
  const msgs: string[] = [`${timeGreet}, ${name}님! 오늘도 화이팅 🔥`];

  if (myIdx === 0 && sorted.length > 1) {
    const gap = (sorted[0].totalKm - sorted[1].totalKm).toFixed(1);
    const rival = sorted[1].teamName;
    msgs.push(
      ranToday
        ? `${name}님 덕분에 ${josa(teamName ?? "팀", "이/가")} ${rival}보다 ${gap}km 앞서요! 🔥`
        : `${josa(rival, "이/가")} ${gap}km 차로 쫓아와요! 달려요 ${name}님 💨`
    );
  } else if (myIdx > 0) {
    const gap = (sorted[myIdx - 1].totalKm - sorted[myIdx].totalKm).toFixed(1);
    const above = sorted[myIdx - 1].teamName;
    msgs.push(
      ranToday
        ? `${josa(above, "와/과")} ${gap}km 차이! 역전 바로 앞이에요 🔥`
        : `${name}님, ${josa(above, "와/과")} 단 ${gap}km 차이! 오늘 뛰면 역전이에요 🏃`
    );
  }

  if (memberRank > 0) msgs.push(`개인 순위 ${memberRank}위! 계속 달려요 💪`);
  if (ranToday) msgs.push(`오늘 기록 등록 완료! 승인 대기 중이에요 ⏳`);
  if (!ranToday) msgs.push(`오늘 아직 기록이 없어요. 지금 달려볼까요? 🏃`);

  return msgs;
}

// ── 엔디 캐릭터 (애니메이션) ──────────────────────────────────
function EndiCharacter({ onClick }: { onClick: () => void }) {
  const [hasError, setHasError] = useState(false);
  const controls = useAnimation();

  const handleClick = async () => {
    onClick();
    // 흔들기 애니메이션
    await controls.start({
      rotate: [0, -12, 12, -10, 10, -6, 6, 0],
      transition: { duration: 0.6, ease: "easeInOut" },
    });
  };

  if (hasError) return null;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className="shrink-0 focus:outline-none cursor-pointer"
      title="엔디를 클릭해보세요!"
      whileHover={{ scale: 1.08 }}
      animate={controls}
    >
      {/* float 래퍼 */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src="/endi.png"
          alt="엔디"
          className="h-24 w-24 object-contain drop-shadow-lg"
          onError={() => setHasError(true)}
        />
      </motion.div>
    </motion.button>
  );
}

// ── 말풍선 ────────────────────────────────────────────────────
function SpeechBubble({ children, msgKey }: { children: React.ReactNode; msgKey: number }) {
  return (
    <div className="relative flex-1 min-w-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={msgKey}
          className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-3"
          initial={{ opacity: 0, scale: 0.9, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -6 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          {/* 말풍선 꼬리 */}
          <div
            className="absolute -left-2 bottom-4 h-0 w-0"
            style={{
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderRight: "8px solid rgba(255,255,255,0.10)",
            }}
          />
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── 스켈레톤 ─────────────────────────────────────────────────
function GreetingSkeleton() {
  return (
    <div className="flex items-end gap-3 animate-pulse">
      <div className="h-24 w-24 shrink-0 rounded-2xl bg-white/5" />
      <div className="flex-1 rounded-2xl rounded-bl-sm bg-white/5 px-4 py-4">
        <div className="h-5 w-4/5 rounded bg-white/5" />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function DynamicGreeting({ battleData }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<MemberDashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  const teamColor = user?.teamColorCode ?? "#a78bfa";

  useEffect(() => {
    if (!user) return;
    setDashLoading(true);
    getMyDashboard()
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setDashLoading(false));
  }, [user]);

  const messages =
    user && dashboard
      ? computeMessages(user, battleData, dashboard)
      : ["안녕하세요! 오늘도 함께 달려볼까요? 🏃"];

  // 4초마다 다음 메시지로 순환
  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  // 엔디 클릭 시 다음 메시지로 즉시 이동
  const handleEndiClick = () => {
    setMsgIndex((i) => (i + 1) % messages.length);
  };

  if (authLoading) return <GreetingSkeleton />;
  if (user && (dashLoading || !dashboard)) return <GreetingSkeleton />;

  return (
    <div className="flex items-end gap-3">
      <EndiCharacter onClick={handleEndiClick} />
      <SpeechBubble msgKey={msgIndex}>
        <p className="text-base font-bold text-foreground leading-snug">
          <BoldNumbers text={messages[msgIndex]} color={teamColor} />
        </p>
        {messages.length > 1 && (
          <div className="flex gap-1 mt-2">
            {messages.map((_, i) => (
              <button
                key={i}
                onClick={() => setMsgIndex(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === msgIndex ? "16px" : "6px",
                  background: i === msgIndex ? teamColor : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        )}
      </SpeechBubble>
    </div>
  );
}
