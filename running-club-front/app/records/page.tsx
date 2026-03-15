"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getMyRecords, uploadRecord } from "@/lib/api";
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
} from "lucide-react";

// 기존 UI의 색상 체계 반영
const STATUS_THEME: Record<string, { label: string; badge: string; icon: any; banner: string }> = {
  WAITING: { 
    label: "대기중", 
    badge: "bg-[#facc15]/20 text-[#facc15] border-[#facc15]/30", 
    icon: Loader2,
    banner: "bg-[#facc15]/10 text-[#facc15]"
  },
  APPROVED: { 
    label: "승인됨", 
    badge: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30", 
    icon: CheckCircle,
    banner: "bg-[#22c55e]/10 text-[#22c55e]"
  },
  REJECTED: { 
    label: "반려됨", 
    badge: "bg-destructive/20 text-destructive border-destructive/30", 
    icon: XCircle,
    banner: "bg-destructive/10 text-destructive"
  },
};

export default function RecordsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [records, setRecords] = useState<RunningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({ distance: "", duration: "", runningDate: "", comment: "" });
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
        const month = new Date(record.runningDate).toLocaleDateString("ko-KR", { year: 'numeric', month: 'long' });
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
      pending: records.filter(r => r.status === "WAITING").length
    };
  }, [records]);

  const handleUpload = async () => {
    if (!form.distance || !form.duration || !form.runningDate || !file) {
      setUploadError("모든 항목을 입력하고 사진을 첨부해주세요.");
      return;
    }
    setIsUploading(true);
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
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

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

        {/* 헤더 부분 - image_22b69d.png 스타일 반영 */}
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

        {/* 상단 요약 카드 - image_06877d.png의 카드 스타일 반영 */}
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

      {/* 기록 추가 모달 - 기존 디자인의 다크 모드 버전 */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="bg-[#1a1c23] border-[#2a2d37] text-white">
          <DialogHeader>
            <DialogTitle>러닝 기록 추가</DialogTitle>
            <DialogDescription className="text-gray-400">오늘 달린 기록을 인증해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">거리 (km)</Label>
                <Input type="number" step="0.01" className="bg-[#0c0d10] border-[#2a2d37]" placeholder="5.00" value={form.distance} onChange={e => setForm({...form, distance: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">시간 (분)</Label>
                <Input type="number" className="bg-[#0c0d10] border-[#2a2d37]" placeholder="30" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">러닝 날짜</Label>
              <Input type="date" className="bg-[#0c0d10] border-[#2a2d37]" value={form.runningDate} onChange={e => setForm({...form, runningDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">사진 첨부</Label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#2a2d37] rounded-xl hover:bg-[#2a2d37]/50 cursor-pointer transition-all">
                {file ? <span className="text-[#22c55e] text-sm font-bold">{file.name}</span> : <Camera className="text-gray-600" />}
                <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-[#22c55e] text-black font-bold h-12 rounded-xl" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin" /> : "기록 제출"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 서브 컴포넌트: 상단 요약 카드 (image_06877d.png 디자인 참고)
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

// 서브 컴포넌트: 개별 기록 카드 (image_22b69d.png 디자인 완벽 반영)
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

            <div className="space-y-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#22c55e] italic tracking-tighter">
                  {record.distance.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-gray-500 uppercase italic">km</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <Clock className="h-3.5 w-3.5" />
                {Math.floor(record.duration / 60)}분
              </div>
            </div>
            
            {record.comment && <p className="text-xs text-gray-500 italic">"{record.comment}"</p>}
          </div>

          <div className="h-28 w-28 shrink-0 bg-[#0c0d10] rounded-xl overflow-hidden border border-[#2a2d37]">
            {record.photoUrl ? (
              <img src={record.photoUrl} alt="Run" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center opacity-10">
                <MapPin className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* 상태 배너 - image_22b69d.png 하단 녹색 바 스타일 */}
        <div className={`px-4 py-2 flex items-center gap-2 text-[11px] font-bold ${theme.banner}`}>
          <StatusIcon className={`h-3 w-3 ${record.status === 'WAITING' ? 'animate-spin' : ''}`} />
          {record.status === 'APPROVED' && "랭킹에 반영된 기록입니다."}
          {record.status === 'WAITING' && "관리자가 기록을 검토하고 있습니다."}
          {record.status === 'REJECTED' && "반려된 기록입니다. 사진을 확인 후 다시 올려주세요."}
        </div>
      </CardContent>
    </Card>
  );
}