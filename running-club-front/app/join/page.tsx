"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getActiveCompetitions,
  getTeamsByCompetition,
  getGroupsByTeam,
  join,
} from "@/lib/api";
import type {
  CompetitionForJoin,
  TeamForJoin,
  GroupForJoin,
  JoinRequest,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Data state
  const [competitions, setCompetitions] = useState<CompetitionForJoin[]>([]);
  const [teams, setTeams] = useState<TeamForJoin[]>([]);
  const [groups, setGroups] = useState<GroupForJoin[]>([]);

  // Selection state
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<
    number | null
  >(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch competitions on mount
  useEffect(() => {
    const fetchCompetitions = async () => {
      setIsLoading(true);
      try {
        const response = await getActiveCompetitions();
        if (response.success) {
          setCompetitions(response.data);
        }
      } catch {
        setError("대회 목록을 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompetitions();
  }, []);

  // Fetch teams when competition is selected
  useEffect(() => {
    if (!selectedCompetitionId) {
      setTeams([]);
      return;
    }

    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const response = await getTeamsByCompetition(selectedCompetitionId);
        if (response.success) {
          setTeams(response.data);
        }
      } catch {
        setError("팀 목록을 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, [selectedCompetitionId]);

  // Fetch groups when team is selected
  useEffect(() => {
    if (!selectedTeamId) {
      setGroups([]);
      return;
    }

    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const response = await getGroupsByTeam(selectedTeamId);
        if (response.success) {
          setGroups(response.data);
        }
      } catch {
        setError("조 목록을 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, [selectedTeamId]);

  const handleCompetitionSelect = (value: string | null) => {
    if (!value) return;
    const id = parseInt(value, 10);
    setSelectedCompetitionId(id);
    setSelectedTeamId(null);
    setSelectedGroupId(null);
    setTeams([]);
    setGroups([]);
    setCurrentStep(2);
    setError(null);
  };

  const handleTeamSelect = (value: string | null) => {
    if (!value) return;
    const id = parseInt(value, 10);
    setSelectedTeamId(id);
    setSelectedGroupId(null);
    setGroups([]);
    setCurrentStep(3);
    setError(null);
  };

  const handleGroupSelect = (value: string | null) => {
    if (!value || value === "none") {
      setSelectedGroupId(null);
    } else {
      setSelectedGroupId(parseInt(value, 10));
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedTeamId) {
      setError("팀을 선택해주세요.");
      return;
    }
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!loginId.trim()) {
      setError("아이디를 입력해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const joinData: JoinRequest = {
        loginId: loginId.trim(),
        password,
        name: name.trim(),
        teamId: selectedTeamId,
        ...(selectedGroupId && { groupId: selectedGroupId }),
      };

      await join(joinData);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
            준비중
          </Badge>
        );
      case "PROCEEDING":
        return (
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            진행중
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep) {
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    }
    if (step === currentStep) {
      return <Circle className="h-5 w-5 text-primary fill-primary" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-2xl border-border/50 bg-card/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            회원가입
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            러닝 클럽에 가입하고 함께 달리세요
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              {getStepIcon(1)}
              <span
                className={`text-sm ${currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}
              >
                대회
              </span>
            </div>
            <div className="h-px w-8 bg-border" />
            <div className="flex items-center gap-1">
              {getStepIcon(2)}
              <span
                className={`text-sm ${currentStep >= 2 ? "text-foreground" : "text-muted-foreground"}`}
              >
                팀
              </span>
            </div>
            <div className="h-px w-8 bg-border" />
            <div className="flex items-center gap-1">
              {getStepIcon(3)}
              <span
                className={`text-sm ${currentStep >= 3 ? "text-foreground" : "text-muted-foreground"}`}
              >
                정보 입력
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Competition Selection */}
            <div className="space-y-2">
              <Label htmlFor="competition" className="text-foreground">
                대회 선택
              </Label>
              <Select
                value={selectedCompetitionId?.toString() ?? ""}
                onValueChange={handleCompetitionSelect}
              >
                <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                  <SelectValue placeholder="참가할 대회를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {competitions.map((competition) => (
                    <SelectItem
                      key={competition.id}
                      value={competition.id.toString()}
                    >
                      <div className="flex items-center gap-2">
                        <span>{competition.title}</span>
                        {getStatusBadge(competition.status)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCompetitionId && (
                <p className="text-xs text-muted-foreground">
                  {competitions.find((c) => c.id === selectedCompetitionId)
                    ?.startDate}{" "}
                  ~{" "}
                  {
                    competitions.find((c) => c.id === selectedCompetitionId)
                      ?.endDate
                  }
                </p>
              )}
            </div>

            {/* Step 2: Team Selection */}
            {currentStep >= 2 && (
              <div className="space-y-2">
                <Label htmlFor="team" className="text-foreground">
                  팀 선택
                </Label>
                <Select
                  value={selectedTeamId?.toString() ?? ""}
                  onValueChange={handleTeamSelect}
                  disabled={isLoading || teams.length === 0}
                >
                  <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                    <SelectValue
                      placeholder={
                        isLoading
                          ? "팀 목록 불러오는 중..."
                          : teams.length === 0
                            ? "등록된 팀이 없습니다"
                            : "참가할 팀을 선택하세요"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        <div className="flex items-center gap-2">
                          {team.colorCode && (
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: team.colorCode }}
                            />
                          )}
                          <span>{team.teamName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 3: Group Selection + User Info */}
            {currentStep >= 3 && (
              <>
                {/* Group Selection (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="group" className="text-foreground">
                    조 선택{" "}
                    <span className="text-muted-foreground">(선택 사항)</span>
                  </Label>
                  <Select
                    value={selectedGroupId?.toString() ?? "none"}
                    onValueChange={handleGroupSelect}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                      <SelectValue
                        placeholder={
                          isLoading
                            ? "조 목록 불러오는 중..."
                            : groups.length === 0
                              ? "조 없음"
                              : "조를 선택하세요"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">조 선택 안함</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.groupName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    이름
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus-visible:ring-primary"
                    required
                  />
                </div>

                {/* Login ID */}
                <div className="space-y-2">
                  <Label htmlFor="loginId" className="text-foreground">
                    아이디
                  </Label>
                  <Input
                    id="loginId"
                    type="text"
                    placeholder="사용할 아이디를 입력하세요"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus-visible:ring-primary"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    비밀번호
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus-visible:ring-primary"
                    required
                  />
                </div>

                {/* Password Confirm */}
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm" className="text-foreground">
                    비밀번호 확인
                  </Label>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus-visible:ring-primary"
                    required
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit Button */}
            {currentStep >= 3 && (
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={isSubmitting || !selectedTeamId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  "가입하기"
                )}
              </Button>
            )}
          </form>

          {/* Login Link */}
          <div className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <a
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              로그인
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
