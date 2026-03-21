"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getMyRecords, uploadRecord, resolvePhotoUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EndiSpeechBanner from "@/components/EndiSpeechBanner";
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
  Trophy,
  History,
  TrendingUp,
  Timer,
} from "lucide-react";

const STATUS_THEME: Record<string, { label: string; badge: string; icon: any; banner: string }> = {
  WAITING: {
    label: "대기중",
    badge: "bg-[#facc15]/20 text-[#facc15] border-[#facc15]/30",
    icon: Loader2,
    banner: "bg-[#facc15]/10 text-[#facc15]",
  },
  APPROVED: {
    label: "승인됨",
    badge: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30",
    icon: CheckCircle,
    banner: "bg-[#22c55e]/10 text-[#22c55e]",
  },
  REJECTED: {
    label: "반려됨",
    badge: "bg-destructive/20 text-destructive border-destructive/30",
    icon: XCircle,
    banner: "bg-destructive/10 text-destructive",
  },
};

/** 초(seconds)를 "M'SS\"" 페이스 형식으로 변환 */
function formatPace(durationSec: number, distanceKm: number): string {
  if (distanceKm <= 0) return "-";
  const paceSeconds = durationSec / distanceKm;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.round(paceSeconds % 60);
  return `${min}'${String(sec).padStart(2, "0")}"`;
}

/** 초(seconds)를 "M분 SS초" 형식으로 변환 */
function formatDuration(durationSec: number): string {
  const min = Math.floor(durationSec / 60);
  const sec = durationSec % 60;
  if (sec === 0) return `${min}분`;
  return `${min}분 ${sec}초`;
}

export default function RecordsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [records, setRecords] = useState<RunningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({ distance: "", minutes: "", seconds: "", runningDate: "", comment: "" });
  const [file, setFile] = useState<File | null>(null);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyRecords();
      setRecords(data);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const groupedRecords = useMemo(() => {
    const groups: Record<string, RunningRecord[]> = {};
    [...records].sort((a, b) => new Date(b.runningDate).getTime() - new Date(a.runningDate).getTime())
      .forEach(record => {
        const month = new Date(record.runningDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
        if (!groups[month]) groups[month] = [];
        groups[month].push(record);
      });
    return groups;
  }, [records]);

  const stats = useMemo(() => {
    const approved = records.filter(r => r.status === "APPROVED");
    return {
      totalDist: approved.reduce((acc, cur) => acc + cur.distance, 0).toFixed(2),
      count: approved.length,
      pending: records.filter(r => r.status === "WAITING").length,
    };
  }, [records]);

  /** 거리 입력: 숫자만, 소수점 2자리까지 */
  const handleDistanceChange = (val: string) => {
    // 숫자와 소수점만 허용
    const cleaned = val.replace(/[^0-9.]/g, "");
    // 소수점 여러 개 방지
    const parts = cleaned.split(".");
    let result = parts[0];
    if (parts.length > 1) {
      result += "." + parts[1].slice(0, 2);
    }
    setForm({ ...form, distance: result });
  };

  /** 분 입력: 0~999 정수 */
  const handleMinutesChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(0, 3);
    setForm({ ...form, minutes: cleaned });
  };

  /** 초 입력: 0~59 정수 */
  const handleSecondsChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(0, 2);
    const num = parseInt(cleaned || "0");
    if (num > 59) return;
    setForm({ ...form, seconds: cleaned });
  };

  const handleUpload = async () => {
    const dist = parseFloat(form.distance);
    const min = parseInt(form.minutes || "0");
    const sec = parseInt(form.seconds || "0");
    const totalSeconds = min * 60 + sec;

    if (!form.distance || isNaN(dist) || dist <= 0) {
      setUploadError("거리를 올바르게 입력해주세요. (예: 5.25)");
      return;
    }
    if (dist > 100) {
      setUploadError("거리는 100km 이하로 입력해주세요.");
      return;
    }
    if (totalSeconds <= 0) {
      setUploadError("시간을 입력해주세요.");
      return;
    }
    if (!form.runningDate) {
      setUploadError("러닝 날짜를 선택해주세요.");
      return;
    }
    if (!file) {
      setUploadError("인증 사진을 첨부해주세요.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadRecord({
        distance: dist,
        duration: totalSeconds,
        runningDate: form.runningDate,
        comment: form.comment || undefined,
        file,
      });
      setUploadOpen(false);
      setForm({ distance: "", minutes: "", seconds: "", runningDate: "", comment: "" });
      setFile(null);
      await fetchRecords();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 실시간 페이스 미리보기
  const previewPace = useMemo(() => {
    const dist = parseFloat(form.distance);
    const min = parseInt(form.minutes || "0");
    const sec = parseInt(form.seconds || "0");
    const total = min * 60 + sec;
    if (!dist || dist <= 0 || total <= 0) return null;
    return formatPace(total, dist);
  }, [form.distance, form.minutes, form.seconds]);

  return (
    <div className="min-h-screen bg-[#0c0d10] text-white p-4 pb-24 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* 엔디 배너 */}
        <EndiSpeechBanner
          teamColor={user?.teamColorCode ?? "#a78bfa"}
          messages={[
            "기록을 올리고 승인된 기록을 확인해보세요 📋",
            "승인된 기록이 팀 랭킹에 반영돼요 🏆",
            "오늘도 달리고 기록을 남겨봐요 🏃",
          ]}
        />

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#22c55e] p-1.5 rounded-lg">
              <ClipboardList className="h-6 w-6 text-black" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight hidden md:block">내 기록</h1>
          </div>
          <Button
            className="bg-[#22c55e] text-black font-bold hover:bg-[#22c55e]/90 rounded-xl"
            onClick={() => { setUploadError(null); setUploadOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-1" /> 기록 추가
          </Button>
        </div>

        {/* 상단 요약 카드 */}
        <div className="grid grid-cols-3 gap-3">
          <StatsCard label="누적 거리" value={stats.totalDist} unit="km" icon={TrendingUp} />
          <StatsCard label="승인 횟수" value={stats.count} unit="회" icon={Trophy} />
          <StatsCard label="검토 대기" value={stats.pending} unit="건" icon={History} />
        </div>

        {/* 월별 타임라인 리스트 */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl bg-[#1a1c23]" />)}
          </div>
        ) : records.length === 0 ? (
          <Card className="bg-[#1a1c23] border-[#2a2d37] border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-gray-500">
              <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">기록이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedRecords).map(([month, monthRecords]) => (
              <div key={month} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#22c55e] uppercase tracking-wider">{month}</span>
                  <div className="h-[1px] flex-1 bg-[#2a2d37]"></div>
                </div>
                <div className="space-y-4">
                  {monthRecords.map((r) => <RecordCard key={r.id} record={r} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 기록 추가 모달 */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="bg-[#1a1c23] border-[#2a2d37] text-white max-w-sm !top-auto !bottom-0 !translate-y-0 sm:!top-1/2 sm:!bottom-auto sm:!-translate-y-1/2 max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg">러닝 기록 추가</DialogTitle>
            <DialogDescription className="text-gray-400">오늘 달린 기록을 인증해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2 overflow-y-auto flex-1 min-h-0">
            {/* 거리 */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs font-semibold">거리</Label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  className="bg-[#0c0d10] border-[#2a2d37] pr-12 text-lg font-bold h-12"
                  placeholder="0.00"
                  value={form.distance}
                  onChange={e => handleDistanceChange(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">km</span>
              </div>
            </div>

            {/* 시간 (분 + 초) */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs font-semibold">시간</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="bg-[#0c0d10] border-[#2a2d37] pr-8 text-lg font-bold h-12 text-center"
                    placeholder="0"
                    value={form.minutes}
                    onChange={e => handleMinutesChange(e.target.value)}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">분</span>
                </div>
                <span className="text-gray-500 text-lg font-bold">:</span>
                <div className="relative flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="bg-[#0c0d10] border-[#2a2d37] pr-8 text-lg font-bold h-12 text-center"
                    placeholder="00"
                    value={form.seconds}
                    onChange={e => handleSecondsChange(e.target.value)}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">초</span>
                </div>
              </div>
            </div>

            {/* 실시간 페이스 미리보기 */}
            {previewPace && (
              <div className="flex items-center gap-2 rounded-xl bg-[#22c55e]/10 px-3 py-2">
                <Timer className="h-4 w-4 text-[#22c55e]" />
                <span className="text-xs text-gray-400">예상 페이스</span>
                <span className="text-sm font-bold text-[#22c55e] ml-auto">{previewPace} /km</span>
              </div>
            )}

            {/* 러닝 날짜 */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs font-semibold">러닝 날짜</Label>
              <Input
                type="date"
                className="bg-[#0c0d10] border-[#2a2d37] h-12"
                value={form.runningDate}
                onChange={e => setForm({ ...form, runningDate: e.target.value })}
              />
            </div>

            {/* 코멘트 (선택) */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs font-semibold">한마디 <span className="text-gray-600">(선택)</span></Label>
              <Input
                type="text"
                className="bg-[#0c0d10] border-[#2a2d37]"
                placeholder="오늘 러닝 한줄평"
                value={form.comment}
                onChange={e => setForm({ ...form, comment: e.target.value })}
              />
            </div>

            {/* 사진 첨부 */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs font-semibold">인증 사진</Label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#2a2d37] rounded-xl hover:bg-[#2a2d37]/30 cursor-pointer transition-all">
                {file ? (
                  <span className="text-[#22c55e] text-sm font-bold truncate max-w-[80%] px-2">{file.name}</span>
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-gray-600 mb-1" />
                    <span className="text-xs text-gray-500">사진을 선택해주세요</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            {/* 에러 */}
            {uploadError && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{uploadError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-[#22c55e] text-black font-bold h-12 rounded-xl text-base"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : "기록 제출"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({ label, value, unit, icon: Icon }: any) {
  return (
    <div className="bg-[#1a1c23] border border-[#2a2d37] p-4 rounded-2xl space-y-2">
      <div className="bg-[#22c55e]/10 w-fit p-1.5 rounded-lg">
        <Icon className="h-4 w-4 text-[#22c55e]" />
      </div>
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{label}</p>
        <p className="text-lg font-black italic">{value}<span className="text-[10px] ml-0.5 not-italic text-gray-400 font-normal">{unit}</span></p>
      </div>
    </div>
  );
}

function RecordCard({ record }: { record: RunningRecord }) {
  const theme = STATUS_THEME[record.status] || STATUS_THEME.WAITING;
  const StatusIcon = theme.icon;

  return (
    <Card className="bg-[#1a1c23] border-[#2a2d37] overflow-hidden rounded-2xl">
      <CardContent className="p-0">
        <div className="p-5 flex justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`rounded-md px-1.5 py-0 text-[10px] font-bold border-none ${theme.badge}`}>
                {theme.label}
              </Badge>
              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <Calendar className="h-3 w-3" />
                {new Date(record.runningDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#22c55e] italic tracking-tighter">
                  {record.distance.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-gray-500 uppercase italic">km</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(record.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5" />
                  {formatPace(record.duration, record.distance)} /km
                </span>
              </div>
            </div>

            {record.comment && <p className="text-xs text-gray-500 italic">&ldquo;{record.comment}&rdquo;</p>}
          </div>

          <div className="h-28 w-28 shrink-0 bg-[#0c0d10] rounded-xl overflow-hidden border border-[#2a2d37]">
            {record.photoUrl ? (
              <img src={resolvePhotoUrl(record.photoUrl)!} alt="Run" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center opacity-10">
                <MapPin className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
        </div>

        <div className={`px-4 py-2 flex items-center gap-2 text-[11px] font-bold ${theme.banner}`}>
          <StatusIcon className={`h-3 w-3 ${record.status === "WAITING" ? "animate-spin" : ""}`} />
          {record.status === "APPROVED" && "랭킹에 반영된 기록입니다."}
          {record.status === "WAITING" && "관리자가 기록을 검토하고 있습니다."}
          {record.status === "REJECTED" && "반려된 기록입니다. 사진을 확인 후 다시 올려주세요."}
        </div>
      </CardContent>
    </Card>
  );
}
