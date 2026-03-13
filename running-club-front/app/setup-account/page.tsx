"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setupAccount } from "@/lib/api";
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
import { Loader2, ShieldCheck } from "lucide-react";

export default function SetupAccountPage() {
  const router = useRouter();
  const { user, loading, setUser } = useAuth();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 미인증 또는 이미 설정된 사용자 리다이렉트
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.needsSetup) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await setupAccount(loginId, password);
      setUser(updatedUser);
      router.push(updatedUser.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "계정 설정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md bg-card border-border/50 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            계정 설정
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            안녕하세요, <span className="text-foreground font-medium">{user.name}</span>님!
            앞으로 사용할 아이디와 비밀번호를 설정해주세요.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />설정 중...</>
              ) : (
                "계정 설정 완료"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
