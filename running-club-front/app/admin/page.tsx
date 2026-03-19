"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getWaitingRecords, getAdminCompetitions, getAdminMembers, getNotices } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Trophy,
  ShieldCheck,
  ChevronRight,
  History,
  Users,
  Bell,
  UserPlus,
  AlertCircle,
} from "lucide-react";

export default function AdminHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [waitingCount, setWaitingCount] = useState(0);
  const [competitionCount, setCompetitionCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);

  useEffect(() => {
    Promise.all([
      getWaitingRecords(),
      getAdminCompetitions(),
      getAdminMembers(),
      getNotices(),
    ])
      .then(([records, competitions, members, notices]) => {
        setWaitingCount(records.length);
        setCompetitionCount(competitions.length);
        setMemberCount(members.length);
        setUnassignedCount(members.filter((m) => !m.teamId).length);
        setNoticeCount(notices.length);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const statCards = [
    { label: "승인 대기", value: waitingCount, icon: ClipboardCheck, href: "/admin/approvals", urgent: waitingCount > 0, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    { label: "전체 회원", value: memberCount, icon: Users, href: "/admin/members", urgent: false, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    { label: "미배정 회원", value: unassignedCount, icon: UserPlus, href: "/admin/members", urgent: unassignedCount > 0, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    { label: "등록 대회", value: competitionCount, icon: Trophy, href: "/admin/competitions", urgent: false, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  ];

  const quickLinks = [
    { label: "기록 승인", desc: "승인 대기중인 러닝 기록 검토·처리", icon: ClipboardCheck, href: "/admin/approvals", badge: waitingCount > 0 ? `${waitingCount}건` : null },
    { label: "승인 히스토리", desc: "처리 완료 기록 조회 및 검색", icon: History, href: "/admin/history", badge: null },
    { label: "회원 관리", desc: "회원 목록 조회 및 팀·조 배정", icon: Users, href: "/admin/members", badge: unassignedCount > 0 ? `미배정 ${unassignedCount}명` : null },
    { label: "대회 관리", desc: "대회·팀·조 생성 및 관리", icon: Trophy, href: "/admin/competitions", badge: null },
    { label: "공지사항 관리", desc: "공지사항 작성·수정·삭제", icon: Bell, href: "/admin/notices", badge: `${noticeCount}건` },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* 헤더 */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">관리자 대시보드</h1>
              {user && (
                <p className="text-xs text-muted-foreground">
                  {user.name}님, 안녕하세요
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 긴급 알림 */}
        {!isLoading && waitingCount > 0 && (
          <Card
            className="border-yellow-500/30 bg-yellow-500/5 cursor-pointer hover:bg-yellow-500/10 transition-colors"
            onClick={() => router.push("/admin/approvals")}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-200 font-medium flex-1">
                승인 대기 기록 <span className="text-yellow-400">{waitingCount}건</span>이 있습니다
              </p>
              <ChevronRight className="h-4 w-4 text-yellow-400/60" />
            </CardContent>
          </Card>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, href, urgent, color, bg, border }) => (
            <Card
              key={label}
              className={`border-border/50 bg-card cursor-pointer hover:border-primary/40 transition-colors ${urgent ? border : ""}`}
              onClick={() => router.push(href)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  {urgent && (
                    <Badge variant="outline" className={`text-[10px] ${color} ${border} px-1.5 py-0`}>
                      확인 필요
                    </Badge>
                  )}
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                )}
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 빠른 이동 */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">전체 메뉴</p>
          {quickLinks.map(({ label, desc, icon: Icon, href, badge }) => (
            <Card
              key={href + label}
              className="border-border/50 bg-card cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push(href)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm">{label}</p>
                    {badge && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary">
                        {badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
