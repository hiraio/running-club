"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { login, firstLogin } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound, UserCheck } from "lucide-react";

type Mode = "normal" | "first";

const ENDI_MESSAGES: Record<Mode | "loading", string> = {
  normal:  "안녕하세요! 오늘도 함께 달려봐요 🏃",
  first:   "처음 오셨군요! 반가워요 😊",
  loading: "잠깐만요, 확인 중이에요 🔍",
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setShowWelcome } = useAuth();
  const [mode, setMode] = useState<Mode>("normal");

  // 일반 로그인 필드
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  // 최초 로그인 필드
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [endiVisible, setEndiVisible] = useState(true);

  const msgKey = isLoading ? "loading" : mode;

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await login(loginId, password);
      if (!user) {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      setUser(user);
      if (user.role === "ADMIN") {
        router.push("/admin");
        return;
      }
      setShowWelcome(true);
      router.push("/dashboard");
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirstLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await firstLogin(name, phone);
      setUser(user);
      if (user.needsSetup) {
        router.push("/setup-account");
      } else {
        setShowWelcome(true);
        router.push("/dashboard");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "ALREADY_REGISTERED") {
        switchMode("normal");
        setError("이미 계정이 설정된 회원입니다. 아이디와 비밀번호로 로그인해주세요.");
      } else {
        setError("이름 또는 전화번호가 올바르지 않습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setLoginId(""); setPassword(""); setName(""); setPhone("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background gap-4">

      {/* ── 엔디 + 말풍선 ──────────────────────────────────── */}
      <motion.div
        className="flex items-end gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
      >
        {/* 엔디 캐릭터 */}
        {endiVisible && (
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src="/endi.png"
              alt="엔디"
              className="h-20 w-20 object-contain drop-shadow-lg"
              onError={() => setEndiVisible(false)}
            />
          </motion.div>
        )}

        {/* 말풍선 */}
        <div className="relative">
          {/* 꼬리 */}
          <div
            className="absolute -left-2 bottom-4 h-0 w-0"
            style={{
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderRight: "8px solid rgba(255,255,255,0.08)",
            }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={msgKey}
              className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-2.5"
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                {ENDI_MESSAGES[msgKey]}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── 로그인 카드 ────────────────────────────────────── */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.2 }}
      >
        <Card className="bg-card border-border/50 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Running Club
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === "normal"
                ? "아이디와 비밀번호로 로그인하세요"
                : "등록된 이름과 전화번호로 처음 로그인하세요"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 모드 전환 탭 */}
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              <button
                type="button"
                onClick={() => switchMode("normal")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                  mode === "normal"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <KeyRound className="size-3.5" />
                일반 로그인
              </button>
              <button
                type="button"
                onClick={() => switchMode("first")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                  mode === "first"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck className="size-3.5" />
                최초 로그인
              </button>
            </div>

            {/* 일반 로그인 폼 */}
            {mode === "normal" && (
              <form onSubmit={handleNormalLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginId" className="text-foreground">아이디</Label>
                  <Input
                    id="loginId"
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
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
                  disabled={isLoading || !loginId || !password}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />로그인 중...</> : "로그인"}
                </Button>
              </form>
            )}

            {/* 최초 로그인 폼 */}
            {mode === "first" && (
              <form onSubmit={handleFirstLogin} className="space-y-4">
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-muted-foreground">
                  관리자가 사전 등록한 이름과 전화번호를 입력하세요.
                  로그인 후 아이디·비밀번호를 설정합니다.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">이름</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">전화번호</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={isLoading}
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
                  disabled={isLoading || !name || !phone}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />확인 중...</> : "다음"}
                </Button>
              </form>
            )}

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
