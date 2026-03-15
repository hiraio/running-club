"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getApprovalHistory } from "@/lib/api";
import type { AdminHistoryDTO } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ClipboardList,
  Clock,
  Calendar,
  User,
} from "lucide-react";

// ── 상수 ───────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ── 헬퍼 ───────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(isoStr: string): string {
  return new Date(isoStr).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── 상세 모달 ──────────────────────────────────────────────────

function DetailModal({
  record,
  onClose,
}: {
  record: AdminHistoryDTO | null;
  onClose: () => void;
}) {
  if (!record) return null;
  const isApproved = record.status === "APPROVED";

  return (
    <Dialog open={!!record} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isApproved
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              : <XCircle className="h-4 w-4 text-destructive" />}
            기록 #{record.id} 상세
          </DialogTitle>
        </DialogHeader>

        {/* 인증샷 */}
        <div className="rounded-xl overflow-hidden bg-secondary aspect-video flex items-center justify-center">
          {record.photoUrl ? (
            <img
              src={record.photoUrl}
              alt="러닝 인증샷"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <MapPin className="h-8 w-8 opacity-30" />
              <p className="text-xs">인증샷 없음</p>
            </div>
          )}
        </div>

        {/* 정보 그리드 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: "신청자", value: record.userName },
            { label: "팀 / 조", value: [record.teamName, record.groupName].filter(Boolean).join(" / ") || "-" },
            { label: "러닝 날짜", value: formatDate(record.runningDate) },
            { label: "거리", value: `${record.distance.toFixed(2)} km` },
            { label: "시간", value: formatDuration(record.duration) },
            { label: "페이스", value: `${(record.duration / 60 / record.distance).toFixed(1)} 분/km` },
            { label: "처리자", value: record.approvedByName ?? "-" },
            { label: "신청일시", value: formatDateTime(record.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {record.comment && (
          <div className="rounded-lg bg-white/5 px-3 py-2 text-sm text-muted-foreground italic">
            "{record.comment}"
          </div>
        )}

        {!isApproved && record.rejectedReason && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span className="font-semibold">반려 사유: </span>
            {record.rejectedReason}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────

export default function ApprovalHistoryPage() {
  const [records, setRecords] = useState<AdminHistoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<AdminHistoryDTO | null>(null);

  // 필터 상태
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "REJECTED">("ALL");

  // 페이지네이션
  const [page, setPage] = useState(1);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      setRecords(await getApprovalHistory());
    } catch {
      // 에러 무시 — 빈 목록 유지
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => { setPage(1); }, [dateFrom, dateTo, nameQuery, statusFilter]);

  // ── 필터링 ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (nameQuery.trim() && !r.userName.includes(nameQuery.trim())) return false;
      if (dateFrom && r.runningDate < dateFrom) return false;
      if (dateTo && r.runningDate > dateTo) return false;
      return true;
    });
  }, [records, statusFilter, nameQuery, dateFrom, dateTo]);

  // ── 요약 ────────────────────────────────────────────────────
  const summary = useMemo(() => ({
    total: filtered.length,
    approved: filtered.filter((r) => r.status === "APPROVED").length,
    rejected: filtered.filter((r) => r.status === "REJECTED").length,
    totalKm: filtered
      .filter((r) => r.status === "APPROVED")
      .reduce((s, r) => s + r.distance, 0),
  }), [filtered]);

  // ── 페이지네이션 ─────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── 스켈레톤 ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <History className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">승인 히스토리</h1>
          <Badge className="bg-primary/20 text-primary border border-primary/40">
            전체 {records.length}건
          </Badge>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: ClipboardList,
              label: "조회된 기록",
              value: `${summary.total}건`,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: TrendingUp,
              label: "승인 거리 합계",
              value: `${summary.totalKm.toFixed(1)}km`,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10",
            },
            {
              icon: CheckCircle2,
              label: "승인 건수",
              value: `${summary.approved}건`,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10",
            },
            {
              icon: XCircle,
              label: "반려 건수",
              value: `${summary.rejected}건`,
              color: "text-destructive",
              bg: "bg-destructive/10",
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <Card key={label} className="border-border/50 bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 필터 바 */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              {/* 날짜 범위 */}
              <div className="flex items-center gap-2">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> 시작일
                  </p>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-8 w-36 bg-background border-border text-sm"
                  />
                </div>
                <span className="text-muted-foreground mt-4">~</span>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> 종료일
                  </p>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-8 w-36 bg-background border-border text-sm"
                  />
                </div>
              </div>

              {/* 이름 검색 */}
              <div className="space-y-1 flex-1 min-w-[140px]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <User className="h-3 w-3" /> 이름 검색
                </p>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="이름 입력"
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    className="h-8 pl-7 bg-background border-border text-sm"
                  />
                </div>
              </div>

              {/* 상태 필터 */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">상태</p>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                >
                  <SelectTrigger className="h-8 w-32 bg-background border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="APPROVED">승인 완료</SelectItem>
                    <SelectItem value="REJECTED">반려됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 필터 초기화 */}
              {(dateFrom || dateTo || nameQuery || statusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground hover:text-foreground mt-4"
                  onClick={() => {
                    setDateFrom(""); setDateTo("");
                    setNameQuery(""); setStatusFilter("ALL");
                  }}
                >
                  초기화
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 데이터 테이블 */}
        <Card className="border-border/50 bg-card overflow-hidden">
          {filtered.length === 0 ? (
            <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <History className="h-12 w-12 opacity-20 mb-3" />
              <p className="font-medium">조건에 맞는 기록이 없습니다</p>
            </CardContent>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs w-24">러닝 날짜</TableHead>
                    <TableHead className="text-muted-foreground text-xs">이름 (팀 / 조)</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-24 text-right">거리</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-20 text-right">시간</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-20 text-center">상태</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-24">처리자</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-32">신청일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((r) => (
                    <TableRow
                      key={r.id}
                      className="border-border/30 cursor-pointer hover:bg-white/[0.04] transition-colors"
                      onClick={() => setSelected(r)}
                    >
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {formatDate(r.runningDate)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{r.userName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {[r.teamName, r.groupName].filter(Boolean).join(" · ") || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          {r.distance.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">km</span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDuration(r.duration)}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.status === "APPROVED" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5">
                            승인
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/15 text-destructive border border-destructive/30 text-[10px] px-1.5">
                            반려
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.approvedByName ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(r.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}건
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "...")[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "..." ? (
                          <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-1">
                            …
                          </span>
                        ) : (
                          <Button
                            key={p}
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 text-xs ${
                              page === p
                                ? "bg-primary/20 text-primary font-bold"
                                : "text-muted-foreground"
                            }`}
                            onClick={() => setPage(p as number)}
                          >
                            {p}
                          </Button>
                        )
                      )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

      </div>

      {/* 상세 모달 */}
      <DetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
