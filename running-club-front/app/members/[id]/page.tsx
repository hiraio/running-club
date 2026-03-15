"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getMemberPublicProfile } from "@/lib/api";
import type { MemberPublicProfileResponse } from "@/lib/types";
import GoalProgressRing from "@/components/GoalProgressRing";
import WeeklyActivityCard from "@/components/WeeklyActivityCard";
import { motion } from "framer-motion";
import {
  Trophy, Calendar, Clock, TrendingUp,
  School, BookOpen, Target, MapPin, ArrowLeft,
} from "lucide-react";

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<MemberPublicProfileResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memberId = Number(params.id);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (!memberId || isNaN(memberId)) { router.replace("/ranking"); return; }

    getMemberPublicProfile(memberId)
      .catch((err) => {
        if (err.message === "UNAUTHORIZED") router.replace("/login");
        else setError("프로필을 불러오지 못했습니다.");
      })
      .then((d) => { if (d) setData(d); })
      .finally(() => setApiLoading(false));
  }, [authLoading, user, memberId, router]);

  const teamColor = data?.teamColorCode ?? "#8B5CF6";
  const teamColorLight = teamColor + "22";

  if (authLoading || apiLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: teamColor, borderTopColor: "transparent" }}
          />
          <p className="text-sm text-muted-foreground">프로필 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error ?? "데이터 없음"}</p>
      </div>
    );
  }

  const progressPercent = data.targetDistance
    ? Math.min((data.totalDistance / data.targetDistance) * 100, 100)
    : 0;

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">

        {/* ── 뒤로가기 ─────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-2 mb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </button>
        </div>

        {/* ── 1. 프로필 카드 ─────────────────────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-white/5 bg-card p-5 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${teamColor}, ${teamColor}88)`,
                boxShadow: `0 4px 20px ${teamColor}44`,
              }}
            >
              {data.name.slice(0, 1)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{data.name}</h2>
                {data.teamName && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: teamColorLight, color: teamColor }}
                  >
                    {data.teamName}
                  </span>
                )}
                {data.groupName && (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-foreground/60">
                    {data.groupName}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {data.school && (
                  <span className="flex items-center gap-1">
                    <School className="h-3.5 w-3.5" />
                    {data.school}
                  </span>
                )}
                {data.major && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {data.major}
                  </span>
                )}
              </div>

              {data.bio && (
                <p className="mt-2 text-sm text-foreground/70 leading-snug">
                  &ldquo;{data.bio}&rdquo;
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── 2. 달리기 통계 + 목표 링 ───────────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-white/5 bg-card p-5 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Target className="h-4 w-4" style={{ color: teamColor }} />
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
              달리기 현황
            </h3>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
            <GoalProgressRing
              current={data.totalDistance}
              target={data.targetDistance}
              color={teamColor}
              size={180}
              strokeWidth={14}
            />

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:gap-4 w-full sm:w-auto">
              {[
                {
                  icon: <TrendingUp className="h-4 w-4" />,
                  label: "누적 거리",
                  value: data.totalDistance.toFixed(1),
                  unit: "km",
                },
                {
                  icon: <Calendar className="h-4 w-4" />,
                  label: "러닝 횟수",
                  value: String(data.totalRuns),
                  unit: "회",
                },
                {
                  icon: <Trophy className="h-4 w-4" />,
                  label: "전체 순위",
                  value: data.memberRank > 0 ? `${data.memberRank}위` : "-",
                  unit: "",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded-xl p-3"
                  style={{ background: teamColorLight }}
                >
                  <div style={{ color: teamColor }}>{stat.icon}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                  <div className="text-xl font-black text-foreground tabular-nums">
                    {stat.value}
                  </div>
                  {stat.unit && (
                    <div className="text-xs text-muted-foreground">{stat.unit}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {data.targetDistance && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>0 km</span>
                <span>목표 {data.targetDistance} km</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${teamColor}, ${teamColor}cc)`,
                    boxShadow: `0 0 8px ${teamColor}88`,
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* ── 3. 주간 활동 차트 ─────────────────────────────────────── */}
        <WeeklyActivityCard
          teamColor={teamColor}
          targetDistance={data.targetDistance}
          initialRecords={data.recentRecords}
        />

        {/* ── 4. 최근 활동 기록 ─────────────────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-white/5 bg-card shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <Calendar className="h-4 w-4" style={{ color: teamColor }} />
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
              최근 활동 기록
            </h3>
          </div>

          <div className="px-5 pb-5 space-y-2">
            {data.recentRecords.length === 0 ? (
              <div className="py-10 text-center">
                <MapPin className="h-8 w-8 mx-auto text-white/20 mb-2" />
                <p className="text-sm text-muted-foreground">아직 기록이 없습니다.</p>
              </div>
            ) : (
              data.recentRecords.map((record, idx) => (
                <motion.div
                  key={record.id}
                  className="flex items-center gap-4 rounded-xl bg-white/[0.03] border border-white/5 p-3.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.07 }}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-center"
                    style={{ background: teamColorLight }}
                  >
                    <span className="text-[9px] font-medium" style={{ color: teamColor }}>
                      {new Date(record.runningDate).getMonth() + 1}월
                    </span>
                    <span className="text-base font-black" style={{ color: teamColor }}>
                      {new Date(record.runningDate).getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {record.distance.toFixed(2)} km
                      </span>
                      {record.comment && (
                        <span className="text-xs text-muted-foreground truncate">
                          · {record.comment}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(record.duration)}</span>
                      {record.groupName && (
                        <>
                          <span className="text-white/20">·</span>
                          <span>{record.groupName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-foreground">
                      {(record.duration / 60 / record.distance).toFixed(1)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">페이스(분/km)</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
