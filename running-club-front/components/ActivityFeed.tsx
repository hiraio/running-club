"use client";

import { useEffect, useState, useRef, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, TrendingUp, Flame, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { getRecentFeed } from "@/lib/api";
import type { FeedItem, FeedHighlight, RecentFeedResponse } from "@/lib/types";

// ── 팀 배지 스타일 ────────────────────────────────────────────
function getTeamStyle(teamName: string | null, colorCode: string | null) {
  if (!teamName || !colorCode) return {};

  const isWhite =
    colorCode.toLowerCase() === "#ffffff" ||
    colorCode.toLowerCase() === "#fff" ||
    teamName.includes("백");

  const c = isWhite ? "#e2e8f0" : colorCode;
  return {
    color: c,
    background: `${c}15`,
    boxShadow: `0 0 8px ${c}55`,
    border: `1px solid ${c}30`,
  };
}

function TeamNeonBadge({
  name,
  colorCode,
}: {
  name: string | null;
  colorCode: string | null;
}) {
  if (!name) return null;
  return (
    <span
      className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-black"
      style={getTeamStyle(name, colorCode)}
    >
      {name}
    </span>
  );
}

// ── 상대 시간 ─────────────────────────────────────────────────
function getRelativeTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ── 불꽃 응원 버튼 ────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
}

function FireButton() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [count, setCount] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newOnes: Particle[] = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 60 - 30,
      y: -(Math.random() * 50 + 30),
    }));

    setParticles((prev) => [...prev, ...newOnes]);
    setCount((c) => c + 1);

    const ids = newOnes.map((p) => p.id);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !ids.includes(p.id)));
    }, 900);
  };

  return (
    <div className="relative flex items-center">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="pointer-events-none absolute text-sm select-none"
            style={{ left: "50%", bottom: "100%", translateX: "-50%" }}
            initial={{ opacity: 1, y: 0, x: p.x, scale: 1 }}
            animate={{ opacity: 0, y: p.y, scale: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          >
            🔥
          </motion.span>
        ))}
      </AnimatePresence>

      <button
        onClick={handleClick}
        className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-orange-500/10 hover:text-orange-400 active:scale-95"
      >
        <Flame className="h-3 w-3" />
        <span>{count > 0 ? count : "응원"}</span>
      </button>
    </div>
  );
}

// ── 하이라이트 카드 (오늘의 킹 / 이번 주 급성장) — 컴팩트 배지 스타일
function HighlightCard({
  icon: Icon,
  iconColor,
  title,
  highlight,
  valueSuffix,
}: {
  icon: ElementType;
  iconColor: string;
  title: string;
  highlight: FeedHighlight;
  valueSuffix: string;
}) {
  const c = highlight.teamColorCode;
  const isWhite =
    !c ||
    c.toLowerCase() === "#ffffff" ||
    (highlight.teamName?.includes("백") ?? false);
  const displayColor = isWhite ? "#e2e8f0" : (c ?? "#6366f1");

  return (
    <div
      className="flex-1 min-w-0 rounded-xl border border-white/5 bg-card px-3 py-2.5 flex items-center gap-2.5"
      style={{ boxShadow: `0 0 12px ${displayColor}15` }}
    >
      {/* 아이콘 배지 */}
      <div
        className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
        style={{ background: `${iconColor}18` }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">
            {title}
          </span>
        </div>
        <p className="text-xs font-bold text-foreground truncate">{highlight.userName}</p>
      </div>

      {/* 수치 강조 배지 */}
      <div
        className="shrink-0 rounded-lg px-2 py-1 text-center"
        style={{ background: `${displayColor}15` }}
      >
        <span className="text-sm font-black tabular-nums whitespace-nowrap" style={{ color: displayColor }}>
          {Math.round(highlight.value)}{valueSuffix}
        </span>
      </div>
    </div>
  );
}

// ── 피드 아이템 카드 ──────────────────────────────────────────
function FeedItemCard({ item, index }: { item: FeedItem; index: number }) {
  const c = item.teamColorCode;
  const isWhite =
    !c ||
    c.toLowerCase() === "#ffffff" ||
    (item.teamName?.includes("백") ?? false);
  const accentColor = isWhite ? "#94a3b8" : (c ?? "#6366f1");

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className="relative rounded-xl border border-white/5 bg-card overflow-hidden"
    >
      {/* 팀 컬러 좌측 액센트 바 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}80` }}
      />

      <div className="pl-4 pr-3 py-3 flex items-start gap-3">
        {/* 아바타 */}
        <div
          className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-black text-white"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
            boxShadow: `0 0 10px ${accentColor}44`,
          }}
        >
          {item.userName.slice(0, 1)}
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          {/* 이름 + 팀 배지 + 시간 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-foreground">{item.userName}</span>
            <TeamNeonBadge name={item.teamName} colorCode={item.teamColorCode} />
            {item.groupName && (
              <span className="text-[9px] text-muted-foreground">{item.groupName}</span>
            )}
            <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
              {getRelativeTime(item.createdAt)}
            </span>
          </div>

          {/* 거리 + 시간 + 응원 */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 shrink-0" style={{ color: accentColor }} />
              <span className="text-xs font-black tabular-nums" style={{ color: accentColor }}>
                {item.distance.toFixed(2)}
              </span>
              <span className="text-[10px] text-muted-foreground">km</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {Math.floor(item.duration / 60)}분
            </span>
            <div className="ml-auto">
              <FireButton />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── 피드 슬라이더 ─────────────────────────────────────────────
const ITEMS_PER_PAGE = 3;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0 }),
};

function FeedSlider({ records }: { records: FeedItem[] }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE);
  const pageItems = records.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const paginate = (dir: number) => {
    const next = page + dir;
    if (next < 0 || next >= totalPages) return;
    setPage([next, dir]);
  };

  // 터치 스와이프
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) paginate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div className="space-y-3">
      {/* 슬라이드 영역 */}
      <div
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="space-y-2"
          >
            {pageItems.map((item, i) => (
              <FeedItemCard key={item.id} item={item} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 페이지 네비게이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-0.5">
          <button
            onClick={() => paginate(-1)}
            disabled={page === 0}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3 w-3" />
            이전
          </button>

          {/* 도트 인디케이터 */}
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage([i, i > page ? 1 : -1])}
                className="rounded-full transition-all"
                style={{
                  width: i === page ? 16 : 6,
                  height: 6,
                  background: i === page ? "#6366f1" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => paginate(1)}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            다음
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── 스켈레톤 ─────────────────────────────────────────────────
function ActivityFeedSkeleton() {
  return (
    <div className="space-y-4">
      {/* 하이라이트 스켈레톤 */}
      <div className="flex gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 rounded-xl border border-white/5 bg-card p-3 animate-pulse space-y-2">
            <div className="h-3 w-20 rounded bg-white/5" />
            <div className="h-3.5 w-16 rounded bg-white/5" />
            <div className="h-5 w-12 rounded bg-white/5" />
          </div>
        ))}
      </div>
      {/* 피드 스켈레톤 */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-white/5 bg-card p-3 animate-pulse">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-white/5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 rounded bg-white/5" />
              <div className="h-3 w-full rounded bg-white/5" />
              <div className="h-3 w-16 rounded bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function ActivityFeed() {
  const [data, setData] = useState<RecentFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentFeed()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityFeedSkeleton />;
  if (!data || data.records.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 px-0.5">
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-red-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          최근 활동
        </span>
      </div>

      {/* 하이라이트 행 */}
      {(data.dailyKing || data.risingStar) && (
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {data.dailyKing && (
            <HighlightCard
              icon={Crown}
              iconColor="#fbbf24"
              title="오늘의 킹"
              highlight={data.dailyKing}
              valueSuffix="km"
            />
          )}
          {data.risingStar && (
            <HighlightCard
              icon={TrendingUp}
              iconColor="#34d399"
              title="이번 주 급성장"
              highlight={data.risingStar}
              valueSuffix="%↑"
            />
          )}
        </motion.div>
      )}

      {/* 피드 슬라이더 */}
      <FeedSlider records={data.records} />
    </div>
  );
}
