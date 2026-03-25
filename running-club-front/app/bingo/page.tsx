"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3,
  CheckCircle,
  Camera,
  Trophy,
  Crown,
  Send,
  X,
  Circle,
  Star,
  Plus,
  Clock,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { getBingoBoard, submitBingo } from "@/lib/api";
import type { BingoBoardData, BingoMissionDTO, BingoSubmissionDTO, BingoSubmissionStatus } from "@/lib/types";

// ── 빙고 라인 판정 ──────────────────────────────────────────────

const BINGO_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getBingoInfo(approvedPositions: number[]) {
  const set = new Set(approvedPositions);
  const completedLines = BINGO_LINES.filter((line) =>
    line.every((pos) => set.has(pos))
  );
  const linePositions = new Set(completedLines.flatMap((l) => l));
  return { count: completedLines.length, linePositions };
}

// ── 상태별 스타일 ────────────────────────────────────────────────

type CellStatus = BingoSubmissionStatus | "NONE";

const STATUS_CONFIG: Record<CellStatus, {
  cellBorder: string;
  cellBg: string;
  label: string;
  badgeClass: string;
  textClass: string;
}> = {
  NONE: {
    cellBorder: "border-border/40",
    cellBg: "bg-secondary/30 hover:bg-secondary/50",
    label: "미제출",
    badgeClass: "bg-muted text-muted-foreground hover:bg-muted",
    textClass: "text-foreground",
  },
  PENDING: {
    cellBorder: "border-yellow-500/50",
    cellBg: "bg-yellow-500/5",
    label: "심사중",
    badgeClass: "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20",
    textClass: "text-foreground/80",
  },
  APPROVED: {
    cellBorder: "border-red-500/40",
    cellBg: "bg-red-500/10",
    label: "달성 완료",
    badgeClass: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
    textClass: "text-foreground/60",
  },
  REJECTED: {
    cellBorder: "border-destructive/50",
    cellBg: "bg-destructive/5",
    label: "반려",
    badgeClass: "bg-destructive/20 text-destructive hover:bg-destructive/20",
    textClass: "text-foreground/80",
  },
};

// ── 유틸 ────────────────────────────────────────────────────────

/** groupId → 해당 조의 submission map (position → submission) */
function getGroupSubmissionMap(
  submissions: BingoSubmissionDTO[],
  groupId: number
): Map<number, BingoSubmissionDTO> {
  const map = new Map<number, BingoSubmissionDTO>();
  for (const s of submissions) {
    if (s.groupId === groupId) map.set(s.position, s);
  }
  return map;
}

/** API 응답의 groups 사용, 없으면 submissions에서 추출 (하위 호환) */
function getGroups(data: BingoBoardData): { groupId: number; groupName: string }[] {
  if (data.groups && data.groups.length > 0) return data.groups;
  const map = new Map<number, string>();
  for (const s of data.submissions) {
    if (!map.has(s.groupId)) map.set(s.groupId, s.groupName);
  }
  return Array.from(map.entries()).map(([groupId, groupName]) => ({ groupId, groupName }));
}

// ── 조별 빙고 현황 요약 ──────────────────────────────────────────

function GroupSummary({
  submissions,
  groups,
  activeGroupId,
  onGroupSelect,
}: {
  submissions: BingoSubmissionDTO[];
  groups: { groupId: number; groupName: string }[];
  activeGroupId: number;
  onGroupSelect: (id: number) => void;
}) {
  const summaries = groups
    .map((g) => {
      const approved = submissions
        .filter((s) => s.groupId === g.groupId && s.status === "APPROVED")
        .map((s) => s.position);
      const { count } = getBingoInfo(approved);
      return { ...g, completed: approved.length, bingoCount: count };
    })
    .sort((a, b) => b.bingoCount - a.bingoCount || b.completed - a.completed);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
        <Trophy className="h-4 w-4" />
        조별 빙고 현황
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {summaries.map((s, idx) => (
          <button
            key={s.groupId}
            onClick={() => onGroupSelect(s.groupId)}
            className={`relative text-left rounded-xl border p-3 transition-all ${
              s.groupId === activeGroupId
                ? "border-primary/50 bg-primary/10"
                : "border-border/30 bg-secondary/30 hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {idx === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                <span className="font-bold text-sm">{s.groupName}</span>
              </div>
              {s.bingoCount > 0 && (
                <Badge
                  className={`text-[10px] ${
                    s.bingoCount >= 3
                      ? "bg-yellow-500 text-yellow-950 hover:bg-yellow-500"
                      : "bg-primary/20 text-primary hover:bg-primary/20"
                  }`}
                >
                  {s.bingoCount}빙고
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              {s.completed}/9 미션 달성
            </div>
            {s.bingoCount >= 8 && (
              <div className="absolute -top-1 -right-1 text-lg">🏅</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 미션 상세 Sheet ──────────────────────────────────────────────

function MissionSheet({
  mission,
  submission,
  isMyGroup,
  open,
  onOpenChange,
  onSubmitted,
}: {
  mission: BingoMissionDTO | null;
  submission: BingoSubmissionDTO | null;
  isMyGroup: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const MAX_PHOTOS = 5;
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const incoming = Array.from(newFiles);
    setFiles((prev) => {
      const merged = [...prev, ...incoming].slice(0, MAX_PHOTOS);
      setPreviews(merged.map((f) => URL.createObjectURL(f)));
      return merged;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  };

  const resetState = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!mission) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitBingo(mission.id, files);
      setSubmitted(true);
      setTimeout(() => {
        resetState();
        onOpenChange(false);
        onSubmitted();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출 실패");
      setSubmitting(false);
    }
  };

  if (!mission) return null;

  const status: CellStatus = submission?.status ?? "NONE";
  const config = STATUS_CONFIG[status];
  const canSubmit = isMyGroup && (status === "NONE" || status === "REJECTED");

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <SheetContent side="bottom" className="bg-card rounded-t-2xl pb-8 max-h-[85vh] flex flex-col">
        <SheetHeader className="mb-4 shrink-0">
          <SheetTitle className="text-left flex items-center gap-2">
            {status === "APPROVED" && <CheckCircle className="h-5 w-5 text-emerald-400" />}
            {status === "PENDING" && <Clock className="h-5 w-5 text-yellow-500" />}
            {status === "REJECTED" && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {status === "NONE" && <Circle className="h-5 w-5 text-muted-foreground" />}
            {mission.title}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pb-2">
          {mission.description && (
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">달성 조건</p>
              <p className="text-sm text-foreground">{mission.description}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge className={config.badgeClass}>{config.label}</Badge>
            {submission?.submittedByName && (
              <span className="text-[11px] text-muted-foreground">
                {submission.submittedByName} · {submission.submittedAt?.slice(0, 16).replace("T", " ")}
              </span>
            )}
          </div>

          {status === "PENDING" && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">관리자 승인 대기중</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    인증 사진이 제출되었습니다. 관리자 확인 후 승인 또는 반려됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "REJECTED" && submission?.rejectReason && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">반려 사유</p>
                  <p className="text-xs text-foreground/80 mt-1">{submission.rejectReason}</p>
                </div>
              </div>
            </div>
          )}

          {canSubmit && (
            <div className="space-y-3 border-t border-border/50 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  {status === "REJECTED" && <RotateCcw className="h-3 w-3" />}
                  {status === "REJECTED" ? "다시 제출하기" : "인증 사진 제출"}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  {files.length}/{MAX_PHOTOS}장
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {previews.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-secondary/30">
                    <img src={url} alt={`사진 ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}

                {files.length < MAX_PHOTOS && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/30 transition-all">
                    {files.length === 0 ? (
                      <>
                        <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground">사진 추가</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">추가</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </label>
                )}
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
          )}

          {!isMyGroup && status !== "APPROVED" && (
            <p className="text-xs text-muted-foreground text-center py-2">
              다른 조의 빙고판입니다
            </p>
          )}
        </div>

        {canSubmit && (
          <div className="shrink-0 pt-3 border-t border-border/50">
            {submitted ? (
              <div className="flex items-center justify-center gap-2 py-3 text-emerald-400 font-bold text-sm">
                <CheckCircle className="h-5 w-5" />
                제출 완료! 관리자 승인을 기다려주세요.
              </div>
            ) : (
              <Button
                className="w-full bg-primary text-primary-foreground font-bold h-12 rounded-xl text-base"
                onClick={handleSubmit}
                disabled={files.length === 0 || submitting}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {status === "REJECTED" ? "재제출" : "인증 요청"} ({files.length}장)
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── 메인 빙고 페이지 ─────────────────────────────────────────────

export default function BingoPage() {
  const { user } = useAuth();
  const myGroupId = user?.groupId ?? null;

  const [data, setData] = useState<BingoBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedMission, setSelectedMission] = useState<BingoMissionDTO | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const board = await getBingoBoard();
      setData(board);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "빙고 데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 데이터 로드 후 내 조를 기본 선택
  const groups = useMemo(() => data ? getGroups(data) : [], [data]);

  useEffect(() => {
    if (groups.length > 0 && selectedGroup === null) {
      setSelectedGroup(myGroupId && groups.some((g) => g.groupId === myGroupId) ? myGroupId : groups[0].groupId);
    }
  }, [groups, myGroupId, selectedGroup]);

  const activeGroupId = selectedGroup ?? groups[0]?.groupId ?? 0;
  const isMyGroup = activeGroupId === myGroupId;

  const submissionMap = useMemo(
    () => data ? getGroupSubmissionMap(data.submissions, activeGroupId) : new Map(),
    [data, activeGroupId]
  );

  const approvedPositions = useMemo(
    () => data
      ? data.submissions
          .filter((s) => s.groupId === activeGroupId && s.status === "APPROVED")
          .map((s) => s.position)
      : [],
    [data, activeGroupId]
  );

  const { count: bingoCount, linePositions } = useMemo(
    () => getBingoInfo(approvedPositions),
    [approvedPositions]
  );

  const isAllCleared = approvedPositions.length === (data?.size ?? 3) ** 2;

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  // ── 에러 ──
  if (error || !data) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6">
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Grid3X3 className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">{error ?? "빙고 데이터가 없습니다."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* ── 헤더 ── */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Grid3X3 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-black text-foreground">{data.title}</h1>
        </div>
        <p className="text-xs text-muted-foreground">러닝도 하고 빙고도 채우고!</p>
      </div>

      {/* ── 조 선택 탭 ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {groups.map((g) => {
          const isActive = g.groupId === activeGroupId;
          const isMine = g.groupId === myGroupId;
          const gApproved = data.submissions
            .filter((s) => s.groupId === g.groupId && s.status === "APPROVED")
            .map((s) => s.position);
          const { count } = getBingoInfo(gApproved);
          return (
            <button
              key={g.groupId}
              onClick={() => setSelectedGroup(g.groupId)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {g.groupName}
              {isMine && !isActive && (
                <span className="ml-1 text-[9px] text-primary">내 조</span>
              )}
              {count > 0 && (
                <span className={`ml-1 ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 빙고 보드 ── */}
      <div className="relative">
        <AnimatePresence>
          {isAllCleared && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
            >
              <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500 text-sm px-3 py-1 shadow-lg shadow-yellow-500/30">
                <Star className="h-3.5 w-3.5 mr-1" />
                ALL CLEAR!
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className={`border-border/50 ${isAllCleared ? "ring-2 ring-yellow-500/30" : ""}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-foreground">
                  {groups.find((g) => g.groupId === activeGroupId)?.groupName}
                </span>
                {isMyGroup && (
                  <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[10px]">
                    내 조
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">빙고</span>
                <span className="font-black text-primary text-lg">{bingoCount}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {data.missions.map((mission) => {
                const sub = submissionMap.get(mission.position);
                const status: CellStatus = sub?.status ?? "NONE";
                const config = STATUS_CONFIG[status];
                const isOnLine = linePositions.has(mission.position);

                return (
                  <motion.button
                    key={mission.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedMission(mission);
                      setSheetOpen(true);
                    }}
                    className={`relative aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center text-center transition-all ${
                      status === "APPROVED" && isOnLine
                        ? "border-red-500/60 bg-red-500/15"
                        : `${config.cellBorder} ${config.cellBg}`
                    }`}
                  >
                    <span className={`text-[11px] leading-tight font-bold whitespace-pre-line ${config.textClass}`}>
                      {mission.title}
                    </span>
                    {mission.description && (
                      <span className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                        ({mission.description})
                      </span>
                    )}

                    {status === "APPROVED" && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <div className="h-[70%] w-[70%] rounded-full border-[3px] border-red-500/70" />
                      </motion.div>
                    )}

                    {status === "PENDING" && (
                      <div className="absolute top-1 right-1 pointer-events-none">
                        <div className="h-5 w-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Clock className="h-3 w-3 text-yellow-500" />
                        </div>
                      </div>
                    )}

                    {status === "REJECTED" && (
                      <div className="absolute top-1 right-1 pointer-events-none">
                        <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        </div>
                      </div>
                    )}

                    {isOnLine && status === "APPROVED" && (
                      <div className="absolute inset-0 rounded-xl bg-red-500/5 pointer-events-none" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {isMyGroup && (
              <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full border-2 border-red-500/70" /> 승인
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-yellow-500" /> 심사중
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5 text-destructive" /> 반려
                </span>
              </div>
            )}

            {bingoCount > 0 && (
              <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <div className="h-[3px] w-4 rounded-full bg-red-500/50" />
                <span>빙고 라인 {bingoCount}줄 달성!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 조별 현황 요약 ── */}
      <GroupSummary
        submissions={data.submissions}
        groups={groups}
        activeGroupId={activeGroupId}
        onGroupSelect={setSelectedGroup}
      />

      {/* ── 미션 상세 Sheet ── */}
      <MissionSheet
        mission={selectedMission}
        submission={selectedMission ? submissionMap.get(selectedMission.position) ?? null : null}
        isMyGroup={isMyGroup}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmitted={fetchData}
      />
    </div>
  );
}
