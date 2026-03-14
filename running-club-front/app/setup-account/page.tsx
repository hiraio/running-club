"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setupAccount, updateMemberProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, User, ChevronRight, Check } from "lucide-react";

/**
 * 최초 로그인(VIP) 온보딩 2단계:
 *  Step 1: 계정 설정 (loginId + password) — 필수
 *  Step 2: 프로필 입력 (학교, 전공, 자기소개, 목표 거리) — 선택
 *
 * Step 2는 "건너뛰기"가 가능.
 */
export default function SetupAccountPage() {
  const router = useRouter();
  const { user, loading, setUser } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 필드
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 필드
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [bio, setBio] = useState("");
  const [targetDistance, setTargetDistance] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 미인증 또는 이미 설정된 사용자 리다이렉트
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!user.needsSetup && step === 1) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [user, loading, router, step]);

  // Step 1: 계정 설정
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError("비밀번호가 일치하지 않습니다."); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }

    setIsLoading(true);
    try {
      const updatedUser = await setupAccount(loginId, password);
      setUser(updatedUser);
      setStep(2); // 프로필 입력 단계로
    } catch (err) {
      setError(err instanceof Error ? err.message : "계정 설정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: 프로필 저장 후 대시보드로
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateMemberProfile({
        school: school.trim() || undefined,
        major: major.trim() || undefined,
        bio: bio.trim() || undefined,
        targetDistance: targetDistance ? parseFloat(targetDistance) : undefined,
      });
      router.push("/dashboard");
    } catch {
      // 프로필은 실패해도 대시보드로 이동 (선택 정보이므로)
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipProfile = () => router.push("/dashboard");

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md bg-card border-border/50 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            {step === 1
              ? <ShieldCheck className="h-10 w-10 text-primary" />
              : <User className="h-10 w-10 text-primary" />}
          </div>

          {/* 단계 표시기 */}
          <div className="flex items-center justify-center gap-2 text-xs mb-1">
            <div className={`flex items-center gap-1 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              {step > 1 ? <Check className="h-3.5 w-3.5" /> : <span className="font-bold">1</span>}
              <span>계정 설정</span>
            </div>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <div className={`flex items-center gap-1 ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>
              <span className="font-bold">2</span>
              <span>프로필 입력</span>
            </div>
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {step === 1 ? "계정 설정" : "프로필 입력"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 1
              ? <>안녕하세요, <span className="text-foreground font-medium">{user.name}</span>님!
                  앞으로 사용할 아이디와 비밀번호를 설정해주세요.</>
              : "동아리 멤버들에게 나를 소개해보세요. 모든 항목은 선택 사항입니다."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 1: 계정 설정 */}
          {step === 1 && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginId" className="text-foreground">아이디</Label>
                <Input
                  id="loginId"
                  type="text"
                  placeholder="사용할 아이디를 입력하세요"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading || !loginId || !password || !confirmPassword}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {isLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />설정 중...</>
                  : <>다음 단계 <ChevronRight className="ml-1 h-4 w-4" /></>}
              </Button>
            </form>
          )}

          {/* Step 2: 프로필 입력 */}
          {step === 2 && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school" className="text-foreground">학교</Label>
                <Input
                  id="school"
                  type="text"
                  placeholder="예: 한국대학교"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  disabled={isLoading}
                  className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major" className="text-foreground">전공</Label>
                <Input
                  id="major"
                  type="text"
                  placeholder="예: 체육학과"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  disabled={isLoading}
                  className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-foreground">자기소개</Label>
                <textarea
                  id="bio"
                  placeholder="짧게 자신을 소개해주세요"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                  className="w-full rounded-md border border-border/50 bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDistance" className="text-foreground">
                  목표 거리 <span className="text-muted-foreground text-xs">(km)</span>
                </Label>
                <Input
                  id="targetDistance"
                  type="number"
                  placeholder="예: 100"
                  value={targetDistance}
                  onChange={(e) => setTargetDistance(e.target.value)}
                  disabled={isLoading}
                  min="0"
                  step="0.1"
                  className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipProfile}
                  disabled={isLoading}
                  className="flex-1 border-border/50 text-muted-foreground hover:text-foreground"
                >
                  건너뛰기
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  {isLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</>
                    : "저장하고 시작하기"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
