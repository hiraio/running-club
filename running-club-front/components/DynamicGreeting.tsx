"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMyDashboard } from "@/lib/api";
import type { AuthUser, CompetitionBattle, MemberDashboardData } from "@/lib/types";

interface Props {
  battleData: CompetitionBattle | null;
}

// ── 한국어 조사 자동 선택 ─────────────────────────────────────
function josa(word: string, type: "이/가" | "와/과"): string {
  const code = word.charCodeAt(word.length - 1);
  const hasBatchim = code >= 0xAC00 && (code - 0xAC00) % 28 !== 0;
  if (type === "이/가") return word + (hasBatchim ? "이" : "가");
  return word + (hasBatchim ? "과" : "와");
}

// ── 숫자 자동 볼드 렌더러 ────────────────────────────────────
// "53.4km", "3위", "12%" 같은 패턴을 bold + 팀 컬러로 강조
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

// ── 메시지 조합 (짧고 강렬하게) ─────────────────────────────
function computeMessage(
  user: AuthUser,
  battleData: CompetitionBattle | null,
  dashboard: MemberDashboardData
): string {
  const { name, teamId, teamName } = user;
  const { ranToday, memberRank } = dashboard;

  // 팀 미배정
  if (!teamId) {
    if (ranToday) {
      return memberRank > 0
        ? `오늘도 완주! 현재 ${memberRank}위예요 ${name}님 💪`
        : `오늘도 달리셨네요, ${name}님! 기록 승인 대기 중 🏃`;
    }
    return memberRank > 0
      ? `${name}님, 현재 ${memberRank}위! 오늘 한 번 더 달려봐요 🏃`
      : `${name}님, 오늘 첫 기록 도전해볼까요? 🌟`;
  }

  // 팀 있음, 대회 없거나 READY
  if (!battleData || battleData.status === "READY") {
    return ranToday
      ? `오늘도 달리셨군요! 대회 시작을 기다려요, ${name}님 👍`
      : `${name}님, 오늘 가볍게 1km만 달려볼까요? 🏃`;
  }

  // 대회 진행 중
  const sorted = [...battleData.teams].sort((a, b) => b.totalKm - a.totalKm);
  const myIdx = sorted.findIndex((t) => t.id === teamId);

  if (myIdx === -1) {
    return ranToday
      ? `오늘도 달리셨네요! 기록 승인 후 반영돼요, ${name}님 💪`
      : `${name}님, ${teamName ?? "팀"}의 첫 기록을 남겨봐요! 🔥`;
  }

  if (myIdx === 0) {
    const gap = (sorted[0].totalKm - sorted[1].totalKm).toFixed(1);
    const rival = sorted[1].teamName;
    return ranToday
      ? `${name}님 덕분에 ${josa(teamName ?? "팀", "이/가")} ${rival}보다 ${gap}km 앞서요! 🔥`
      : `${josa(rival, "이/가")} ${gap}km 차로 쫓아와요! 
      지금 달려서 격차 벌려요, ${name}님 💨`;
  }

  const gap = (sorted[myIdx - 1].totalKm - sorted[myIdx].totalKm).toFixed(1);
  const above = sorted[myIdx - 1].teamName;
  return ranToday
    ? `${josa(above, "와/과")} ${gap}km 차이! 역전 바로 앞이에요, ${name}님 🔥`
    : `${name}님, ${josa(above, "와/과")} 단 ${gap}km 차이! 오늘 뛰면 역전이에요 🏃`;
}

// ── 엔디 이미지 ───────────────────────────────────────────────
// public/endi.png 파일 교체 시 바로 반영
const ENDI_IMAGE = "/endi.png";

function EndiCharacter() {
  const [hasError, setHasError] = useState(false);
  if (hasError) return null;
  return (
    <img
      src={ENDI_IMAGE}
      alt="엔디"
      className="h-20 w-20 object-contain shrink-0 drop-shadow-lg"
      onError={() => setHasError(true)}
    />
  );
}

// ── 스켈레톤 ─────────────────────────────────────────────────
function GreetingSkeleton() {
  return (
    <div className="flex items-end gap-3 animate-pulse">
      <div className="h-20 w-20 shrink-0 rounded-2xl bg-white/5" />
      <div className="flex-1 rounded-2xl rounded-bl-sm bg-white/5 px-4 py-4">
        <div className="h-5 w-4/5 rounded bg-white/5" />
      </div>
    </div>
  );
}

// ── 말풍선 ────────────────────────────────────────────────────
function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 min-w-0 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-3">
      <div
        className="absolute -left-2 bottom-4 h-0 w-0"
        style={{
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderRight: "8px solid rgba(255,255,255,0.10)",
        }}
      />
      {children}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function DynamicGreeting({ battleData }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<MemberDashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(false);

  // 팀 컬러 (볼드 숫자 강조에 사용)
  const teamColor = user?.teamColorCode ?? "#a78bfa";

  useEffect(() => {
    if (!user) return;
    setDashLoading(true);
    getMyDashboard()
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setDashLoading(false));
  }, [user]);

  if (authLoading) return <GreetingSkeleton />;
  if (user && (dashLoading || !dashboard)) return <GreetingSkeleton />;

  // 비로그인
  if (!user) {
    return (
      <div className="flex items-end gap-3">
        <EndiCharacter />
        <SpeechBubble>
          <p className="text-base font-bold text-foreground leading-snug">
            안녕하세요! 오늘도 함께 달려볼까요? 🏃
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            로그인하면 맞춤 응원 메시지를 볼 수 있어요
          </p>
        </SpeechBubble>
      </div>
    );
  }

  const message = computeMessage(user, battleData, dashboard!);

  return (
    <div className="flex items-end gap-3">
      <EndiCharacter />
      <SpeechBubble>
        <p className="text-base font-bold text-foreground leading-snug">
          <BoldNumbers text={message} color={teamColor} />
        </p>
      </SpeechBubble>
    </div>
  );
}
