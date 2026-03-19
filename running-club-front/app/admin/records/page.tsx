"use client";

import { useState, useEffect, useCallback } from "react";
import { getWaitingRecords, approveRecord, rejectRecord, resolvePhotoUrl } from "@/lib/api";
import type { RunningRecord } from "@/lib/types";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  ZoomIn,
} from "lucide-react";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

// ── 기록 카드 ──────────────────────────────────────────────────

function RecordCard({
  record,
  onApprove,
  onReject,
  onPhotoClick,
  isProcessing,
}: {
  record: RunningRecord;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onPhotoClick: (url: string) => void;
  isProcessing: boolean;
}) {
  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="p-4 space-y-4">
        {/* 상단: 이름 + 날짜 */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">{record.userName}</p>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              {record.teamName && <span>{record.teamName}</span>}
              {record.teamName && record.groupName && <span>·</span>}
              {record.groupName && <span>{record.groupName}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Calendar className="h-3 w-3" />
            {formatDate(record.runningDate)}
          </div>
        </div>

        {/* 중단: 거리 + 시간 + 사진 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary">
                {record.distance.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">km</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(record.duration)}
            </div>
            {record.comment && (
              <p className="text-xs text-muted-foreground italic">
                &ldquo;{record.comment}&rdquo;
              </p>
            )}
          </div>

          {/* 사진 썸네일 — 클릭하면 전체화면 */}
          {record.photoUrl ? (
            <button
              type="button"
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary focus:outline-none"
              onClick={() => onPhotoClick(resolvePhotoUrl(record.photoUrl)!)}
              title="사진 크게 보기"
            >
              <img
                src={resolvePhotoUrl(record.photoUrl)!}
                alt="러닝 사진"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ) : (
            <div className="h-20 w-20 shrink-0 rounded-xl bg-secondary flex items-center justify-center">
              <MapPin className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* 하단: 버튼 */}
        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1 bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-primary-foreground font-semibold"
            onClick={() => onApprove(record.id)}
            disabled={isProcessing}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            승인
          </Button>
          <Button
            className="flex-1 bg-destructive/10 text-destructive border border-destructive/40 hover:bg-destructive hover:text-destructive-foreground font-semibold"
            onClick={() => onReject(record.id)}
            disabled={isProcessing}
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            반려
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────

export default function AdminRecordsPage() {
  const [records, setRecords] = useState<RunningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // 승인 확인 Dialog
  const [approveTargetId, setApproveTargetId] = useState<number | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // 반려 Dialog
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // 사진 전체화면 뷰어
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      setRecords(await getWaitingRecords());
    } catch (err) {
      console.error("대기 기록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // 승인 확인 → 실제 API 호출
  const handleApproveConfirm = async () => {
    if (!approveTargetId) return;
    setIsApproving(true);
    try {
      await approveRecord(approveTargetId);
      setRecords((prev) => prev.filter((r) => r.id !== approveTargetId));
      setApproveTargetId(null);
    } catch (err) {
      console.error("승인 실패:", err);
    } finally {
      setIsApproving(false);
      setProcessingId(null);
    }
  };

  const handleRejectOpen = (id: number) => {
    setRejectTargetId(id);
    setRejectReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectTargetId || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await rejectRecord(rejectTargetId, rejectReason.trim());
      setRecords((prev) => prev.filter((r) => r.id !== rejectTargetId));
      setRejectTargetId(null);
      setRejectReason("");
    } catch (err) {
      console.error("반려 실패:", err);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">승인 대기 기록</h1>
          {!isLoading && (
            <Badge className="bg-primary/20 text-primary border border-primary/40">
              {records.length}건
            </Badge>
          )}
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <Card className="border-border/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardCheck className="h-14 w-14 mb-3 opacity-30" />
              <p className="font-medium">대기 중인 기록이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onApprove={(id) => { setProcessingId(id); setApproveTargetId(id); }}
                onReject={handleRejectOpen}
                onPhotoClick={setPhotoViewUrl}
                isProcessing={processingId === record.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 승인 확인 Dialog ─────────────────────────────────── */}
      <Dialog
        open={approveTargetId !== null}
        onOpenChange={(open) => {
          if (!open) { setApproveTargetId(null); setProcessingId(null); }
        }}
      >
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              기록을 승인하시겠습니까?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              사진을 꼼꼼히 확인해주세요.<br />
              승인된 기록은 즉시 랭킹에 반영됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setApproveTargetId(null); setProcessingId(null); }}
              disabled={isApproving}
            >
              취소
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              onClick={handleApproveConfirm}
              disabled={isApproving}
            >
              {isApproving ? "처리 중..." : "승인 확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 반려 사유 Dialog ─────────────────────────────────── */}
      <Dialog
        open={rejectTargetId !== null}
        onOpenChange={(open) => { if (!open) setRejectTargetId(null); }}
      >
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              반려 사유 입력
            </DialogTitle>
            <DialogDescription>
              사유를 입력하면 사용자에게 반려 처리됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">반려 사유</Label>
            <Input
              id="reason"
              placeholder="예: 사진이 불명확합니다."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-background border-border"
              disabled={isRejecting}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectTargetId(null)}
              disabled={isRejecting}
            >
              취소
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || isRejecting}
            >
              {isRejecting ? "처리 중..." : "반려 확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 사진 전체화면 뷰어 ──────────────────────────────── */}
      <Dialog
        open={!!photoViewUrl}
        onOpenChange={(open) => { if (!open) setPhotoViewUrl(null); }}
      >
        <DialogContent className="bg-black/95 border-white/10 max-w-3xl w-full p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>인증샷 전체화면</DialogTitle>
          </DialogHeader>
          {photoViewUrl && (
            <img
              src={photoViewUrl}
              alt="러닝 인증샷"
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
