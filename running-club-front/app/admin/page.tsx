"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getWaitingRecords, getAdminCompetitions } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardCheck,
  Trophy,
  ShieldCheck,
  ChevronRight,
  Users,
} from "lucide-react";

export default function AdminHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [waitingCount, setWaitingCount] = useState<number | null>(null);
  const [competitionCount, setCompetitionCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWaitingRecords(), getAdminCompetitions()])
      .then(([records, competitions]) => {
        setWaitingCount(records.length);
        setCompetitionCount(competitions.length);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const stats = [
    {
      label: "승인 대기 기록",
      value: waitingCount,
      icon: ClipboardCheck,
      href: "/admin/approvals",
      urgent: (waitingCount ?? 0) > 0,
    },
    {
      label: "등록된 대회",
      value: competitionCount,
      icon: Trophy,
      href: "/admin/competitions",
      urgent: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* 헤더 */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">관리자 홈</h1>
          </div>
          {user && (
            <p className="text-sm text-muted-foreground pl-10">
              안녕하세요, <span className="text-foreground font-medium">{user.name}</span>님
            </p>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, icon: Icon, href, urgent }) => (
            <Card
              key={href}
              className={`border-border/50 bg-card cursor-pointer hover:border-primary/40 transition-colors ${
                urgent ? "border-yellow-500/40" : ""
              }`}
              onClick={() => router.push(href)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${urgent ? "text-yellow-400" : "text-primary"}`} />
                  {urgent && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-1.5 py-0.5">
                      확인 필요
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{value ?? "-"}</p>
                )}
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 빠른 이동 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">빠른 이동</p>
          {[
            { label: "기록 승인 처리", desc: "승인 대기중인 러닝 기록 검토", icon: ClipboardCheck, href: "/admin/approvals" },
            { label: "대회 관리", desc: "대회·팀·조 CRUD", icon: Trophy, href: "/admin/competitions" },
          ].map(({ label, desc, icon: Icon, href }) => (
            <Card
              key={href}
              className="border-border/50 bg-card cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push(href)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
