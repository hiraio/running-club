"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  Grid3X3,
  Clock,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import {
  getBingoPending,
  approveBingo,
  rejectBingo,
  resolvePhotoUrl,
  createBingoBoard,
  getBingoBoard,
} from "@/lib/api";
import type { BingoSubmissionDTO, BingoBoardData } from "@/lib/types";

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── 인증 요청 카드 ──────────────────────────────────────────────

function RequestCard({
  submission,
  onApprove,
  onReject,
  isProcessing,
}: {
  submission: BingoSubmissionDTO;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isProcessing: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <>
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20 text-xs">
                  {submission.groupName}
                </Badge>
                <span className="font-semibold text-foreground text-sm">
                  {submission.missionTitle || `${submission.position + 1}번 미션`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                제출자: {submission.submittedByName}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              {formatDateTime(submission.submittedAt)}
            </div>
          </div>

          {submission.photoUrls.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {submission.photoUrls.map((url, i) => {
                const resolved = resolvePhotoUrl(url);
                return (
                  <button
                    key={i}
                    className="shrink-0 h-40 w-40 rounded-xl overflow-hidden border border-border/30 bg-secondary/50"
                    onClick={() => resolved && setPreviewUrl(resolved)}
                  >
                    {resolved ? (
                      <img
                        src={resolved}
                        alt={`인증사진 ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-40 w-full rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center">
              <div className="text-center text-muted-foreground/50">
                <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                <span className="text-xs">사진 없음</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-primary-foreground font-semibold"
              onClick={() => onApprove(submission.id)}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              승인
            </Button>
            <Button
              className="flex-1 bg-destructive/10 text-destructive border border-destructive/40 hover:bg-destructive hover:text-destructive-foreground font-semibold"
              onClick={() => onReject(submission.id)}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              거절
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="bg-card border-border/50 max-w-[90vw] max-h-[90vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>사진 미리보기</DialogTitle>
            <DialogDescription>인증 사진 확대</DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="확대 미리보기"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── 빙고판 생성 폼 ──────────────────────────────────────────────

const EMPTY_MISSIONS = Array.from({ length: 9 }, (_, i) => ({
  position: i,
  title: "",
  description: "",
}));

function CreateBoardForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [missions, setMissions] = useState(EMPTY_MISSIONS.map((m) => ({ ...m })));
  const [submitting, setSubmitting] = useState(false);

  const updateMission = (index: number, field: "title" | "description", value: string) => {
    setMissions((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const canSubmit =
    title.trim() &&
    startDate &&
    endDate &&
    missions.every((m) => m.title.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createBingoBoard({
        title: title.trim(),
        startDate,
        endDate,
        missions: missions.map((m) => ({
          position: m.position,
          title: m.title.trim(),
          description: m.description.trim(),
        })),
      });
      alert("빙고판이 생성되었습니다!");
      onCreated();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 기본 정보 */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">기본 정보</h3>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">빙고판 제목</label>
            <Input
              placeholder="예: 2026 1학기 빙고 챌린지"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">시작일</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">종료일</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 미션 입력 (3x3) */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">미션 9개 (3x3 빙고판)</h3>
          <div className="grid grid-cols-3 gap-2">
            {missions.map((m, i) => (
              <div
                key={i}
                className="border border-border/50 rounded-lg p-2 space-y-1.5 bg-secondary/20"
              >
                <div className="text-[10px] text-muted-foreground font-medium">
                  {Math.floor(i / 3) + 1}행 {(i % 3) + 1}열
                </div>
                <Input
                  placeholder="미션 제목"
                  className="text-xs h-8"
                  value={m.title}
                  onChange={(e) => updateMission(i, "title", e.target.value)}
                />
                <Input
                  placeholder="조건 (선택)"
                  className="text-xs h-7 text-muted-foreground"
                  value={m.description}
                  onChange={(e) => updateMission(i, "description", e.target.value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 미리보기 */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">미리보기</h3>
          <div className="grid grid-cols-3 gap-1">
            {missions.map((m, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg border flex items-center justify-center p-1 text-center ${
                  m.title.trim()
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/30 bg-secondary/30"
                }`}
              >
                <div>
                  <p className="text-[10px] font-semibold leading-tight line-clamp-2">
                    {m.title || "미입력"}
                  </p>
                  {m.description && (
                    <p className="text-[8px] text-muted-foreground mt-0.5 line-clamp-1">
                      {m.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full font-semibold"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-1.5" />
        )}
        빙고판 생성
      </Button>
    </div>
  );
}

// ── 현재 빙고판 정보 ────────────────────────────────────────────

function CurrentBoardInfo({ board }: { board: BingoBoardData }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">현재 활성 빙고판</h3>
          <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs">
            활성
          </Badge>
        </div>
        <p className="text-foreground font-semibold">{board.title}</p>
        <p className="text-xs text-muted-foreground">
          {board.startDate} ~ {board.endDate}
        </p>
        <div className="grid grid-cols-3 gap-1 mt-2">
          {board.missions.map((m) => (
            <div
              key={m.id}
              className="rounded-md border border-border/30 bg-card p-1.5 text-center"
            >
              <p className="text-[10px] font-medium leading-tight line-clamp-2">{m.title}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────

type Tab = "pending" | "create";

export default function AdminBingoPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [submissions, setSubmissions] = useState<BingoSubmissionDTO[]>([]);
  const [currentBoard, setCurrentBoard] = useState<BingoBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [approveTargetId, setApproveTargetId] = useState<number | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [pending, board] = await Promise.allSettled([
        getBingoPending(),
        getBingoBoard(),
      ]);
      if (pending.status === "fulfilled") setSubmissions(pending.value);
      if (board.status === "fulfilled") setCurrentBoard(board.value);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = (id: number) => setApproveTargetId(id);
  const handleReject = (id: number) => {
    setRejectReason("");
    setRejectTargetId(id);
  };

  const confirmApprove = async () => {
    if (!approveTargetId) return;
    setProcessingId(approveTargetId);
    try {
      await approveBingo(approveTargetId);
      setApproveTargetId(null);
      await fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "승인 실패");
    } finally {
      setProcessingId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTargetId) return;
    if (!rejectReason.trim()) {
      alert("거절 사유를 입력해주세요.");
      return;
    }
    setProcessingId(rejectTargetId);
    try {
      await rejectBingo(rejectTargetId, rejectReason.trim());
      setRejectTargetId(null);
      setRejectReason("");
      await fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "거절 실패");
    } finally {
      setProcessingId(null);
    }
  };

  const approveTarget = submissions.find((s) => s.id === approveTargetId);
  const rejectTarget = submissions.find((s) => s.id === rejectTargetId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Grid3X3 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-black text-foreground">빙고 관리</h1>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8"
          onClick={() => { setLoading(true); fetchData(); }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === "pending"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
          }`}
          onClick={() => setTab("pending")}
        >
          인증 관리
          {submissions.length > 0 && (
            <Badge className="ml-1.5 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 text-[10px] px-1.5">
              {submissions.length}
            </Badge>
          )}
        </button>
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === "create"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
          }`}
          onClick={() => setTab("create")}
        >
          빙고판 생성
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {tab === "pending" ? (
        <>
          {error && (
            <Card className="border-destructive/50">
              <CardContent className="flex flex-col items-center justify-center py-8 text-destructive">
                <p className="text-sm font-medium mb-3">{error}</p>
                <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchData(); }}>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          )}

          {submissions.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">대기 중인 인증 요청이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <RequestCard
                  key={sub.id}
                  submission={sub}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={processingId === sub.id}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* 현재 빙고판 정보 */}
          {currentBoard && <CurrentBoardInfo board={currentBoard} />}

          {/* 생성 폼 */}
          <CreateBoardForm onCreated={() => { setLoading(true); setTab("pending"); fetchData(); }} />
        </div>
      )}

      {/* 승인 확인 Dialog */}
      <Dialog open={!!approveTargetId} onOpenChange={() => setApproveTargetId(null)}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>빙고 미션 승인</DialogTitle>
            <DialogDescription>
              {approveTarget?.groupName}의 &ldquo;{approveTarget?.missionTitle || `${(approveTarget?.position ?? 0) + 1}번 미션`}&rdquo;을 승인하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setApproveTargetId(null)}>
              취소
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={confirmApprove}
              disabled={processingId === approveTargetId}
            >
              {processingId === approveTargetId ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1.5" />
              )}
              승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 거절 확인 Dialog */}
      <Dialog open={!!rejectTargetId} onOpenChange={() => setRejectTargetId(null)}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>빙고 미션 거절</DialogTitle>
            <DialogDescription>
              {rejectTarget?.groupName}의 &ldquo;{rejectTarget?.missionTitle || `${(rejectTarget?.position ?? 0) + 1}번 미션`}&rdquo;을 거절하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="거절 사유를 입력하세요"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setRejectTargetId(null)}>
              취소
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground"
              onClick={confirmReject}
              disabled={processingId === rejectTargetId || !rejectReason.trim()}
            >
              {processingId === rejectTargetId ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1.5" />
              )}
              거절
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
