"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveCompetitions, getGroupsByCompetition, join } from "@/lib/api";
import type { CompetitionForJoin, GroupForJoin, JoinRequest } from "@/lib/types";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1:대회선택 2:조선택 3:정보입력

  const [competitions, setCompetitions] = useState<CompetitionForJoin[]>([]);
  const [groups, setGroups] = useState<GroupForJoin[]>([]);

  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 대회 목록 로드
  useEffect(() => {
    setIsLoading(true);
    getActiveCompetitions()
      .then((res) => { if (res.success) setCompetitions(res.data); })
      .catch(() => setError("대회 목록을 불러오는 데 실패했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  // 대회 선택 시 조 목록 로드
  useEffect(() => {
    if (!selectedCompetitionId) { setGroups([]); return; }
    setIsLoading(true);
    getGroupsByCompetition(selectedCompetitionId)
      .then((res) => { if (res.success) setGroups(res.data); })
      .catch(() => setError("조 목록을 불러오는 데 실패했습니다."))
      .finally(() => setIsLoading(false));
  }, [selectedCompetitionId]);

  const handleCompetitionSelect = (value: string | null) => {
    if (!value) return;
    setSelectedCompetitionId(parseInt(value, 10));
    setSelectedGroupId(null);
    setGroups([]);
    setStep(2);
    setError(null);
  };

  const handleGroupSelect = (value: string | null) => {
    if (!value) return;
    setSelectedGroupId(parseInt(value, 10));
    setStep(3);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedGroupId) { setError("조를 선택해주세요."); return; }
    if (password !== passwordConfirm) { setError("비밀번호가 일치하지 않습니다."); return; }

    setIsSubmitting(true);
    try {
      const data: JoinRequest = {
        loginId: loginId.trim(),
        password,
        name: name.trim(),
        groupId: selectedGroupId,
      };
      await join(data);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedComp = competitions.find((c) => c.id === selectedCompetitionId);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const stepIcon = (s: number) => {
    if (s < step) return <CheckCircle2 className="h-4 w-4 text-primary" />;
    if (s === step) return <Circle className="h-4 w-4 text-primary fill-primary" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-2xl border-border/50 bg-card/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">회원가입</CardTitle>
          <CardDescription className="text-muted-foreground">
            러닝 클럽에 가입하고 함께 달리세요
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {[{ n: 1, label: "대회" }, { n: 2, label: "조" }, { n: 3, label: "정보 입력" }].map(
              ({ n, label }, i, arr) => (
                <div key={n} className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {stepIcon(n)}
                    <span className={step >= n ? "text-foreground" : "text-muted-foreground"}>
                      {label}
                    </span>
                  </div>
                  {i < arr.length - 1 && <div className="h-px w-8 bg-border" />}
                </div>
              )
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: 대회 선택 */}
            <div className="space-y-2">
              <Label className="text-foreground">대회 선택</Label>
              <Select
                value={selectedCompetitionId?.toString() ?? ""}
                onValueChange={handleCompetitionSelect}
                disabled={isLoading && competitions.length === 0}
              >
                <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                  <SelectValue placeholder="참가할 대회를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {competitions.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{c.title}</span>
                        <Badge
                          variant="secondary"
                          className={c.status === "PROCEEDING"
                            ? "bg-primary/20 text-primary text-[10px]"
                            : "bg-yellow-500/20 text-yellow-400 text-[10px]"}
                        >
                          {c.status === "PROCEEDING" ? "진행중" : "준비중"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedComp && (
                <p className="text-xs text-muted-foreground">
                  {selectedComp.startDate} ~ {selectedComp.endDate}
                </p>
              )}
            </div>

            {/* Step 2: 조 선택 (대회 선택 후 표시) */}
            {step >= 2 && (
              <div className="space-y-2">
                <Label className="text-foreground">조 선택</Label>
                <Select
                  value={selectedGroupId?.toString() ?? ""}
                  onValueChange={handleGroupSelect}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                    <SelectValue
                      placeholder={
                        isLoading ? "조 목록 불러오는 중..." :
                        groups.length === 0 ? "등록된 조가 없습니다" : "소속 조를 선택하세요"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        <span className="text-muted-foreground text-xs mr-1">{g.teamName} ·</span>
                        {g.groupName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGroup && (
                  <p className="text-xs text-muted-foreground">
                    {selectedGroup.teamName} / {selectedGroup.groupName}
                  </p>
                )}
              </div>
            )}

            {/* Step 3: 개인 정보 */}
            {step >= 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">이름</Label>
                  <Input id="name" type="text" placeholder="홍길동" value={name}
                    onChange={(e) => setName(e.target.value)} required
                    className="bg-secondary/50 border-border/50 focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginId" className="text-foreground">아이디</Label>
                  <Input id="loginId" type="text" placeholder="사용할 아이디" value={loginId}
                    onChange={(e) => setLoginId(e.target.value)} required
                    className="bg-secondary/50 border-border/50 focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">비밀번호</Label>
                  <Input id="password" type="password" placeholder="비밀번호" value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className="bg-secondary/50 border-border/50 focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm" className="text-foreground">비밀번호 확인</Label>
                  <Input id="passwordConfirm" type="password" placeholder="비밀번호 재입력" value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)} required
                    className="bg-secondary/50 border-border/50 focus-visible:ring-primary" />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            {step >= 3 && (
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={isSubmitting || !selectedGroupId}
              >
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />가입 중...</>
                  : "가입하기"}
              </Button>
            )}
          </form>

          <div className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <a href="/login" className="text-primary hover:underline font-medium">로그인</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
