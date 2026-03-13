"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMyRecords, uploadRecord } from "@/lib/api";
import type { RunningRecord } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  WAITING: { label: "대기중", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  APPROVED: { label: "승인됨", className: "bg-primary/20 text-primary border-primary/30" },
  REJECTED: { label: "반려됨", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function RecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<RunningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    distance: "",
    duration: "",
    runningDate: "",
    comment: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyRecords();
      setRecords(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleUpload = async () => {
    if (!form.distance || !form.duration || !form.runningDate || !file) {
      setUploadError("모든 항목을 입력하고 사진을 첨부해주세요.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadRecord({
        distance: parseFloat(form.distance),
        duration: parseInt(form.duration) * 60,
        runningDate: form.runningDate,
        comment: form.comment || undefined,
        file,
      });
      setUploadOpen(false);
      setForm({ distance: "", duration: "", runningDate: "", comment: "" });
      setFile(null);
      await fetchRecords();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">내 기록</h1>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => { setUploadError(null); setUploadOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            기록 추가
          </Button>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <Card className="border-border/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="h-14 w-14 mb-3 opacity-30" />
              <p className="font-medium">아직 기록이 없습니다</p>
              <p className="text-sm mt-1">첫 번째 러닝 기록을 추가해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {records.map((r) => {
              const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.WAITING;
              return (
                <Card key={r.id} className="border-border/50 bg-card">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge className={`text-xs border ${st.className}`}>{st.label}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(r.runningDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-primary">
                            {r.distance.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">km</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(r.duration)}
                        </div>
                        {r.comment && (
                          <p className="text-xs text-muted-foreground italic mt-1">"{r.comment}"</p>
                        )}
                      </div>
                      {r.photoUrl ? (
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                          <img src={r.photoUrl} alt="러닝 사진" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-20 w-20 shrink-0 rounded-xl bg-secondary flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    {r.status === "REJECTED" && (
                      <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                        반려된 기록입니다. 다시 제출해주세요.
                      </div>
                    )}
                    {r.status === "APPROVED" && (
                      <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                        랭킹에 반영된 기록입니다.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 기록 추가 Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>기록 추가</DialogTitle>
            <DialogDescription>러닝 기록과 사진을 업로드하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>거리 (km)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="예: 5.42"
                value={form.distance}
                onChange={(e) => setForm({ ...form, distance: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>소요 시간 (분)</Label>
              <Input
                type="number"
                placeholder="예: 35"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>러닝 날짜</Label>
              <Input
                type="date"
                value={form.runningDate}
                onChange={(e) => setForm({ ...form, runningDate: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>한마디 (선택)</Label>
              <Input
                placeholder="예: 아침 러닝"
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>러닝 사진 (필수)</Label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-border p-3 hover:border-primary/50 transition-colors">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "사진을 선택하세요"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />업로드 중...</>
              ) : (
                "업로드"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
