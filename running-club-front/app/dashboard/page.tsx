"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getMyDashboard, getGroupMembers } from "@/lib/api";
import type { MemberDashboardData, GroupMemberDTO } from "@/lib/types";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import EndiSpeechBanner from "@/components/EndiSpeechBanner";
import WeeklyActivityCard from "@/components/WeeklyActivityCard";
import MyContributionCard from "@/components/MyContributionCard";
import GoalProgressRing from "@/components/GoalProgressRing";
import ProfileEditModal from "@/components/ProfileEditModal";
import { motion } from "framer-motion";
import {
  Trophy, Calendar, Clock, TrendingUp, User, School,
  BookOpen, Target, MapPin, Swords, ChevronRight, Pencil, Users,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, showWelcome, setShowWelcome } = useAuth();
  const [data, setData] = useState<MemberDashboardData | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMemberDTO[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }

    getMyDashboard()
      .then((d) => {
        setData(d);
        return d;
      })
      .then((d) => {
        if (user?.groupId) {
          getGroupMembers(user.groupId).then(setGroupMembers).catch(() => {});
        }
        return d;
      })
      .catch((err) => {
        if (err.message === "UNAUTHORIZED") router.replace("/login");
        else setError("데이터를 불러오지 못했습니다.");
      })
      .finally(() => setApiLoading(false));
  }, [authLoading, user, router]);

  const handleOverlayDone = () => setShowWelcome(false);

  const teamColor = data?.teamColorCode ?? user?.teamColorCode ?? "#8B5CF6";
  const teamColorLight = teamColor + "22";

  if (authLoading || apiLoading) {
    return (
      <>
        {showWelcome && user && <WelcomeOverlay user={user} onDone={handleOverlayDone} />}
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: teamColor, borderTopColor: "transparent" }}
            />
            <p className="text-sm text-muted-foreground">대시보드 로딩 중...</p>
          </div>
        </div>
      </>
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
    ? Math.min((data.currentDistance / data.targetDistance) * 100, 100)
    : 0;

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      {showWelcome && user && <WelcomeOverlay user={user} onDone={handleOverlayDone} />}

      {data && (
        <ProfileEditModal
          open={showProfileModal}
          initialData={{
            school: data.school ?? null,
            major: data.major ?? null,
            bio: data.bio ?? null,
            targetDistance: data.targetDistance ?? null,
          }}
          teamColor={teamColor}
          onClose={() => setShowProfileModal(false)}
          onSaved={() => {
            setShowProfileModal(false);
            getMyDashboard().then(setData).catch(() => {});
          }}
        />
      )}

      <div className="min-h-screen bg-background pb-10">
        <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">

          {/* ── 엔디 배너 ─────────────────────────────────────────── */}
          <EndiSpeechBanner
            teamColor={teamColor}
            messages={[
              `${data.name}님의 달리기 현황이에요 🏃`,
              data.ranToday
                ? "오늘 달리셨군요! 정말 멋져요 👏"
                : "오늘 아직 기록이 없어요. 가볍게 달려볼까요? 🏃",
              data.teamName
                ? `${data.teamName} 소속이에요! 오늘도 화이팅 🔥`
                : "팀에서 여러분을 기다리고 있어요 🔥",
            ]}
          />

          {/* ── 1. 프로필 카드 ─────────────────────────────────────── */}
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
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    title="프로필 편집"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
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

                {!data.school && !data.bio && (
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="mt-2 inline-flex items-center text-xs hover:underline"
                    style={{ color: teamColor }}
                  >
                    <User className="h-3 w-3 mr-1" />
                    프로필을 완성해보세요 →
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── 2. 주간 활동 차트 (Weekly Activity) ────────────────────── */}
          <WeeklyActivityCard
            teamColor={teamColor}
            targetDistance={data.targetDistance}
          />

          {/* ── 3. 이번 학기 목표 ────────────────────────────────────── */}
          <motion.div
            className="rounded-2xl border border-white/5 bg-card p-5 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Target className="h-4 w-4" style={{ color: teamColor }} />
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                이번 학기 목표
              </h3>
            </div>

            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
              <GoalProgressRing
                current={data.currentDistance}
                target={data.targetDistance}
                color={teamColor}
                size={180}
                strokeWidth={14}
                onSetGoal={() => setShowProfileModal(true)}
              />

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:gap-4 w-full sm:w-auto">
                {[
                  {
                    icon: <TrendingUp className="h-4 w-4" />,
                    label: "전체 누적 거리",
                    value: data.currentDistance.toFixed(1),
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
                    label: "개인전 순위",
                    value: data.memberRank > 0 ? `${data.memberRank}위` : "-",
                    unit: data.totalRankedMembers > 0 ? `/ ${data.totalRankedMembers}` : "",
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

          {/* ── 4. 팀 대항전 카드 (Team Battle) ────────────────────────── */}
          {data.teamName && (
            <motion.a
              href={data.competitionId ? "/competition" : undefined}
              className="block rounded-2xl border border-white/5 bg-card p-4 shadow-xl hover:bg-white/[0.04] transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4" style={{ color: teamColor }} />
                  <span className="text-sm font-bold text-foreground uppercase tracking-wider">
                    실시간 팀 대항전
                  </span>
                </div>
                {data.competitionId && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: teamColor }}>
                    <span>대회 현황 보기</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${teamColor}, ${teamColor}88)` }}
                >
                  {data.teamName.slice(0, 2)}
                </div>

                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-foreground">
                      {data.teamTotalKm.toFixed(1)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">km</span>
                    </span>
                    {data.teamRank > 0 && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: teamColor + "22", color: teamColor }}
                      >
                        {data.teamRank === 1 ? "🏆 1위" : `${data.teamRank}위`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.teamName} 누적 거리
                  </p>
                </div>

                {data.teamTotalKm > 0 && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-foreground">
                      {((data.currentDistance / data.teamTotalKm) * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">내 기여도</div>
                  </div>
                )}
              </div>
            </motion.a>
          )}

          {/* ── 5. 조 내 기여도 ─────────────────────────────────────────── */}
          {groupMembers.length > 0 && user && (
            <MyContributionCard
              teamColor={teamColor}
              groupName={data.groupName}
              groupMembers={groupMembers}
              userId={user!.id!}
            />
          )}

          {/* ── 6. 내 조 멤버 ────────────────────────────────────────────── */}
          {groupMembers.length > 0 && (
            <motion.div
              className="rounded-2xl border border-white/5 bg-card shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <Users className="h-4 w-4" style={{ color: teamColor }} />
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                  내 조 멤버
                </h3>
                {data.groupName && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold ml-1"
                    style={{ background: teamColorLight, color: teamColor }}
                  >
                    {data.groupName}
                  </span>
                )}
              </div>
              <div className="px-5 pb-5 space-y-2">
                {groupMembers.map((m, i) => {
                  const isMe = m.memberId === user?.id;
                  return (
                    <button
                      key={m.memberId}
                      className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-colors
                        ${isMe
                          ? "border-blue-500/30 bg-blue-500/[0.08] cursor-default"
                          : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      onClick={() => { if (!isMe) router.push(`/members/${m.memberId}`); }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] text-muted-foreground w-4 text-center shrink-0">
                          {i + 1}
                        </span>
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                          style={{ background: `linear-gradient(135deg, ${teamColor}, ${teamColor}88)` }}
                        >
                          {m.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            {m.name}
                            {isMe && (
                              <span className="text-[10px] font-black rounded-full px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30">나</span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {m.totalRuns}회 · {m.memberRank > 0 ? `전체 ${m.memberRank}위` : "기록 없음"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold" style={{ color: teamColor }}>
                          {m.totalDistance.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">km</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── 7. 최근 활동 기록 (Recent Activity) ────────────────────── */}
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
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    첫 번째 러닝 기록을 등록해보세요!
                  </p>
                </div>
              ) : (
                data.recentRecords.map((record, idx) => (
                  <motion.div
                    key={record.id}
                    className="flex items-center gap-4 rounded-xl bg-white/[0.03] border border-white/5 p-3.5 hover:bg-white/[0.06] transition-colors"
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
                        {record.distance > 0 ? (record.duration / 60 / record.distance).toFixed(1) : "-"}
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
    </>
  );
}