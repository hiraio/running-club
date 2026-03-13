"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { RankingItem, RunningRecord } from "@/lib/types";
import { TrendingUp, TrendingDown, Clock, MapPin, Calendar, Trophy } from "lucide-react";

export interface DashboardProps {
  /** 이번 주 총 주행 거리 (km) */
  weeklyTotalDistance: number;
  /** 지난주 대비 거리 차이 (km), 양수면 증가 */
  weeklyDistanceDelta: number;
  /** 주간 랭킹 목록 */
  rankings: RankingItem[];
  /** 현재 사용자의 entityId (내 순위 강조용) */
  currentUserId?: number;
  /** 최근 러닝 활동 내역 */
  recentRecords: RunningRecord[];
}

/**
 * NRC 스타일 다크 모드 러닝 대시보드.
 * props로 데이터를 받아 표시하는 순수 UI 컴포넌트.
 */
export function Dashboard({
  weeklyTotalDistance,
  weeklyDistanceDelta,
  rankings,
  currentUserId,
  recentRecords,
}: DashboardProps) {
  const isPositiveDelta = weeklyDistanceDelta >= 0;
  const topThree = rankings.slice(0, 3);
  const myRank = rankings.find((r) => r.entityId === currentUserId);

  // 순위 메달 색상
  const rankColors: Record<number, string> = {
    1: "from-yellow-400 to-yellow-600",
    2: "from-gray-300 to-gray-500",
    3: "from-amber-600 to-amber-800",
  };

  // duration(초)을 mm:ss 형식으로 변환
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 날짜 형식 변환 (YYYY-MM-DD → M월 D일)
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 이름에서 이니셜 추출
  const getInitials = (name: string): string => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="dark nrc min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* 상단: 이번 주 총 주행 거리 */}
        <Card className="border-0 bg-card shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                This Week
              </p>
              <div className="mt-2 flex items-baseline justify-center gap-2">
                <span className="text-6xl font-black tracking-tight text-foreground md:text-7xl">
                  {weeklyTotalDistance.toFixed(2)}
                </span>
                <span className="text-2xl font-bold text-muted-foreground md:text-3xl">
                  KM
                </span>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {isPositiveDelta ? (
                  <TrendingUp className="h-4 w-4 text-primary" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={`text-sm font-medium ${
                    isPositiveDelta ? "text-primary" : "text-destructive"
                  }`}
                >
                  {isPositiveDelta ? "+" : ""}
                  {weeklyDistanceDelta.toFixed(2)} km vs last week
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 중앙: Weekly Run Rank 리더보드 */}
        <Card className="border-0 bg-card shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Trophy className="h-5 w-5 text-primary" />
              Weekly Run Rank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topThree.map((item) => {
              const isMe = item.entityId === currentUserId;
              return (
                <div
                  key={item.entityId}
                  className={`flex items-center gap-4 rounded-2xl p-3 transition-all ${
                    isMe
                      ? "bg-primary/15 ring-2 ring-primary"
                      : "bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  {/* 순위 뱃지 */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${
                      rankColors[item.rank] || "from-gray-600 to-gray-800"
                    }`}
                  >
                    {item.rank}
                  </div>

                  {/* 아바타 */}
                  <Avatar>
                    <AvatarFallback
                      className={`font-semibold ${
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getInitials(item.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* 이름 */}
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${
                        isMe ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {item.name}
                      {isMe && (
                        <Badge
                          variant="default"
                          className="ml-2 bg-primary text-primary-foreground"
                        >
                          YOU
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.recordCount} runs
                    </p>
                  </div>

                  {/* 거리 */}
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        isMe ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {item.totalDistance.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">km</p>
                  </div>
                </div>
              );
            })}

            {/* 내 순위 (Top 3 아닌 경우) */}
            {myRank && myRank.rank > 3 && (
              <>
                <div className="flex items-center gap-2 px-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">Your Rank</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-primary/15 p-3 ring-2 ring-primary">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {myRank.rank}
                  </div>
                  <Avatar>
                    <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                      {getInitials(myRank.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">
                      {myRank.name}
                      <Badge
                        variant="default"
                        className="ml-2 bg-primary text-primary-foreground"
                      >
                        YOU
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {myRank.recordCount} runs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {myRank.totalDistance.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">km</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 하단: 최근 활동 내역 */}
        <Card className="border-0 bg-card shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRecords.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No recent activities
              </div>
            ) : (
              recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-4 rounded-2xl bg-secondary/50 p-4 transition-all hover:bg-secondary"
                >
                  {/* 날짜 */}
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/20">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(record.runningDate).split("월")[0]}월
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatDate(record.runningDate).split(" ")[1]?.replace("일", "")}
                    </span>
                  </div>

                  {/* 상세 정보 */}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {record.userName}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      {record.teamName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {record.teamName}
                        </span>
                      )}
                      {record.groupName && (
                        <span className="text-muted-foreground/60">
                          {record.groupName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 거리 & 시간 */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {record.distance.toFixed(2)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        km
                      </span>
                    </p>
                    <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(record.duration)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
