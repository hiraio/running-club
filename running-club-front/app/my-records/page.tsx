"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Upload,
  Image as ImageIcon,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { RunningRecord } from "@/lib/types";
import { getMyRecords, uploadRecord } from "@/lib/api";

function StatusBadge({ status }: { status: RunningRecord["status"] }) {
  switch (status) {
    case "APPROVED":
      return (
        <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
          승인됨
        </Badge>
      );
    case "WAITING":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20"
        >
          대기중
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="destructive"
          className="bg-destructive/20 text-destructive hover:bg-destructive/20"
        >
          반려됨
        </Badge>
      );
    default:
      return null;
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${secs}초`;
  }
  return `${secs}초`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function RecordCard({ record }: { record: RunningRecord }) {
  return (
    <Card className="border-border/50 bg-card transition-all hover:bg-card/80">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* 날짜 및 상태 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(record.runningDate)}
              </div>
              <StatusBadge status={record.status} />
            </div>

            {/* 거리와 시간 */}
            <div className="flex items-baseline gap-4">
              <div>
                <span className="text-3xl font-bold text-primary">
                  {record.distance.toFixed(2)}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">km</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(record.duration)}</span>
              </div>
            </div>

            {/* 코멘트 */}
            {record.comment && (
              <p className="text-sm text-muted-foreground">{record.comment}</p>
            )}

            {/* 팀/조 정보 */}
            {(record.teamName || record.groupName) && (
              <div className="flex gap-2 text-xs text-muted-foreground">
                {record.teamName && (
                  <span className="rounded bg-secondary px-2 py-0.5">
                    {record.teamName}
                  </span>
                )}
                {record.groupName && (
                  <span className="rounded bg-secondary px-2 py-0.5">
                    {record.groupName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 사진 썸네일 */}
          {record.photoUrl && (
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
              <img
                src={record.photoUrl}
                alt="러닝 기록 사진"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    runningDate: new Date().toISOString().split("T")[0],
    distance: "",
    durationMinutes: "",
    comment: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("사진을 업로드해주세요.");
      return;
    }

    if (!formData.distance || !formData.durationMinutes) {
      setError("거리와 소요시간을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await uploadRecord({
        distance: Number(formData.distance),
        duration: Number(formData.durationMinutes) * 60, // 분 -> 초 변환
        runningDate: formData.runningDate,
        comment: formData.comment || undefined,
        file,
      });

      // 성공 시 폼 초기화 및 다이얼로그 닫기
      setFormData({
        runningDate: new Date().toISOString().split("T")[0],
        distance: "",
        durationMinutes: "",
        comment: "",
      });
      setFile(null);
      setPreview(null);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        setError("로그인이 필요합니다.");
      } else {
        setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            기록 업로드
          </DialogTitle>
          <DialogDescription>
            오늘의 러닝 기록을 등록하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 날짜 */}
          <div className="space-y-2">
            <Label htmlFor="runningDate">날짜</Label>
            <Input
              id="runningDate"
              type="date"
              value={formData.runningDate}
              onChange={(e) =>
                setFormData({ ...formData, runningDate: e.target.value })
              }
              className="bg-background border-border"
            />
          </div>

          {/* 거리 */}
          <div className="space-y-2">
            <Label htmlFor="distance">거리 (km)</Label>
            <Input
              id="distance"
              type="number"
              step="0.01"
              min="0"
              placeholder="예: 5.25"
              value={formData.distance}
              onChange={(e) =>
                setFormData({ ...formData, distance: e.target.value })
              }
              className="bg-background border-border"
            />
          </div>

          {/* 소요시간 */}
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">소요시간 (분)</Label>
            <Input
              id="durationMinutes"
              type="number"
              min="1"
              placeholder="예: 30"
              value={formData.durationMinutes}
              onChange={(e) =>
                setFormData({ ...formData, durationMinutes: e.target.value })
              }
              className="bg-background border-border"
            />
          </div>

          {/* 코멘트 */}
          <div className="space-y-2">
            <Label htmlFor="comment">코멘트 (선택)</Label>
            <Input
              id="comment"
              type="text"
              placeholder="오늘의 러닝은 어땠나요?"
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              className="bg-background border-border"
            />
          </div>

          {/* 사진 업로드 */}
          <div className="space-y-2">
            <Label htmlFor="photo">사진</Label>
            <div className="flex gap-4">
              <label
                htmlFor="photo"
                className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ImageIcon className="mb-1 h-6 w-6" />
                <span className="text-xs">사진 선택</span>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {preview && (
                <div className="relative h-24 w-24 overflow-hidden rounded-lg">
                  <img
                    src={preview}
                    alt="미리보기"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "업로드 중..." : "업로드"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MyRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<RunningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyRecords();
      setRecords(data);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/login");
      } else {
        console.error("기록 조회 실패:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 통계 계산
  const totalDistance = records.reduce((sum, r) => sum + r.distance, 0);
  const approvedRecords = records.filter((r) => r.status === "APPROVED");
  const approvedDistance = approvedRecords.reduce(
    (sum, r) => sum + r.distance,
    0
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <Activity className="mr-2 inline-block h-8 w-8 text-primary" />
              내 기록
            </h1>
            <p className="mt-1 text-muted-foreground">
              나의 러닝 기록을 확인하고 관리하세요
            </p>
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            기록 업로드
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="border-border/50 bg-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">총 기록 수</p>
              <p className="text-2xl font-bold">{records.length}회</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">총 거리</p>
              <p className="text-2xl font-bold">
                <span className="text-primary">{totalDistance.toFixed(2)}</span>
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  km
                </span>
              </p>
            </CardContent>
          </Card>
          <Card className="col-span-2 border-border/50 bg-card sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">승인된 거리</p>
              <p className="text-2xl font-bold">
                <span className="text-primary">
                  {approvedDistance.toFixed(2)}
                </span>
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  km
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 기록 목록 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">기록 내역</h2>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <Card className="border-border/50 bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MapPin className="mb-2 h-12 w-12 opacity-50" />
                <p>아직 등록된 기록이 없습니다.</p>
                <Button
                  variant="link"
                  className="mt-2 text-primary"
                  onClick={() => setIsDialogOpen(true)}
                >
                  첫 기록 업로드하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 업로드 다이얼로그 */}
      <UploadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchRecords}
      />
    </div>
  );
}
