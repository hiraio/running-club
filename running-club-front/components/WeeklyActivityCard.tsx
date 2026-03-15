"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { getMyRecords } from "@/lib/api";
import type { RunningRecord } from "@/lib/types";

// ── 헬퍼 ──────────────────────────────────────────────────────

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

interface DayData {
  label: string;
  dayName: string;
  date: string; // "YYYY-MM-DD"
  km: number;
  isToday: boolean;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday anchor
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeekData(records: RunningRecord[], weekStart: Date): DayData[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const km = records
      .filter((r) => r.runningDate === dateStr && r.status !== "REJECTED")
      .reduce((sum, r) => sum + r.distance, 0);
    return {
      label: DAY_LABELS[i],
      dayName: DAY_NAMES[i],
      date: dateStr,
      km,
      isToday: dateStr === todayStr,
    };
  });
}

// ── 커스텀 툴팁 ───────────────────────────────────────────────

interface TooltipPayloadItem {
  value: number;
  payload: DayData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1b23] px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-0.5">
        {d.date.slice(5).replace("-", "/")} ({d.dayName})
      </p>
      <p className="font-black text-white text-sm">
        {d.km > 0 ? `${d.km.toFixed(2)} km` : "기록 없음"}
      </p>
    </div>
  );
}

// ── 스켈레톤 ──────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-card p-5 shadow-xl animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded bg-white/10" />
        <div className="h-3.5 w-32 rounded bg-white/10" />
      </div>
      <div className="h-3 w-48 rounded bg-white/10 mb-5" />
      <div className="flex items-end gap-2 h-24">
        {[60, 30, 80, 45, 90, 20, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-white/10"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────

interface WeeklyActivityCardProps {
  teamColor: string;
  targetDistance: number | null;
  /** 외부에서 기록을 직접 주입할 때 사용. 없으면 내부에서 /api/records/my 호출. */
  initialRecords?: RunningRecord[];
}

export default function WeeklyActivityCard({
  teamColor,
  targetDistance,
  initialRecords,
}: WeeklyActivityCardProps) {
  const [records, setRecords] = useState<RunningRecord[] | null>(
    initialRecords ?? null
  );
  const [loading, setLoading] = useState(!initialRecords);

  useEffect(() => {
    if (initialRecords) return; // 외부 데이터 있으면 fetch 생략
    getMyRecords()
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [initialRecords]);

  const { thisWeek, thisTotal, lastTotal } = useMemo(() => {
    if (!records) return { thisWeek: [], thisTotal: 0, lastTotal: 0 };
    const now = new Date();
    const thisStart = getWeekStart(now);
    const lastStart = new Date(thisStart);
    lastStart.setDate(thisStart.getDate() - 7);

    const thisWeek = buildWeekData(records, thisStart);
    const lastWeek = buildWeekData(records, lastStart);
    const thisTotal = thisWeek.reduce((s, d) => s + d.km, 0);
    const lastTotal = lastWeek.reduce((s, d) => s + d.km, 0);
    return { thisWeek, thisTotal, lastTotal };
  }, [records]);

  if (loading) return <Skeleton />;

  const hasData = thisWeek.some((d) => d.km > 0);
  const dailyGoal = targetDistance ? targetDistance / 7 : null;
  const maxKm = Math.max(...thisWeek.map((d) => d.km), dailyGoal ?? 0, 0.1);

  // 인사이트 계산
  let insightText = "";
  let InsightIcon = Minus;
  let insightColor = "text-muted-foreground";

  if (thisTotal > 0 && lastTotal > 0) {
    const pct = Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
    if (pct > 0) {
      insightText = `지난주보다 ${pct}% 더 달렸어요! 🔥`;
      InsightIcon = TrendingUp;
      insightColor = "text-emerald-400";
    } else if (pct < 0) {
      insightText = `지난주보다 ${Math.abs(pct)}% 적게 달렸어요 😅`;
      InsightIcon = TrendingDown;
      insightColor = "text-orange-400";
    } else {
      insightText = `지난주와 같은 페이스예요 👍`;
      insightColor = "text-sky-400";
    }
  } else if (thisTotal > 0 && lastTotal === 0) {
    insightText = "이번 주 첫 러닝! 멋진 시작이에요 🎉";
    insightColor = "text-emerald-400";
  }

  const gradientId = `weeklyBarGradient_${teamColor.replace("#", "")}`;
  const colorLight = teamColor + "33";

  return (
    <motion.div
      className="rounded-2xl border border-white/5 bg-card p-5 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: teamColor }} />
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
            Weekly Activity
          </h3>
        </div>
        {thisTotal > 0 && (
          <span className="text-xs font-bold tabular-nums" style={{ color: teamColor }}>
            {thisTotal.toFixed(1)} km
          </span>
        )}
      </div>

      {/* 인사이트 한 줄 */}
      {insightText && (
        <div className={`flex items-center gap-1.5 text-xs mb-4 ${insightColor}`}>
          <InsightIcon className="h-3 w-3 shrink-0" />
          <span>{insightText}</span>
        </div>
      )}

      {/* 데이터 없음 */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: colorLight }}
          >
            <Activity className="h-6 w-6" style={{ color: teamColor }} />
          </div>
          <p className="text-sm font-medium text-foreground/70">
            이번 주 기록이 아직 없어요!
          </p>
          <p className="text-xs text-muted-foreground">
            오늘 첫 러닝을 기록해보세요 🏃
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={thisWeek} barCategoryGap="20%" margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={teamColor} stopOpacity={1} />
                  <stop offset="100%" stopColor={teamColor} stopOpacity={0.35} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={(props) => {
                  const { x, y, payload, index } = props as {
                    x: number; y: number;
                    payload: { value: string };
                    index: number;
                  };
                  const isToday = thisWeek[index]?.isToday;
                  return (
                    <text
                      x={x}
                      y={y + 12}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={isToday ? 800 : 400}
                      fill={isToday ? teamColor : "rgba(255,255,255,0.35)"}
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />

              {dailyGoal && dailyGoal > 0 && (
                <ReferenceLine
                  y={dailyGoal}
                  stroke={teamColor}
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.04)", radius: 6 }}
              />

              <Bar dataKey="km" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {thisWeek.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.km === 0
                        ? "rgba(255,255,255,0.06)"
                        : entry.isToday
                        ? teamColor
                        : `url(#${gradientId})`
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* 목표선 레전드 */}
          {dailyGoal && dailyGoal > 0 && (
            <div className="flex items-center gap-1.5 mt-1 justify-end">
              <div
                className="h-px w-5 border-t-2 border-dashed"
                style={{ borderColor: teamColor + "66" }}
              />
              <span className="text-[10px] text-muted-foreground">
                일일 목표 {dailyGoal.toFixed(1)}km
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
