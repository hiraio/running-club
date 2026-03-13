"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminCompetitions,
  createCompetition,
  updateCompetition,
  deleteCompetition,
} from "@/lib/api";
import type {
  CompetitionSummary,
  CompetitionCreateRequest,
  CompetitionUpdateRequest,
} from "@/lib/types";
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
  Trophy,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  CalendarRange,
} from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  READY: {
    label: "준비중",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  PROCEEDING: {
    label: "진행중",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  FINISHED: {
    label: "종료",
    className: "bg-muted text-muted-foreground border-border",
  },
};

type FormState = { title: string; startDate: string; endDate: string };
const emptyForm: FormState = { title: "", startDate: "", endDate: "" };

export default function AdminCompetitionsPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<CompetitionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 생성 Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  // 수정 Dialog
  const [editTarget, setEditTarget] = useState<CompetitionSummary | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  // 삭제 Dialog
  const [deleteTarget, setDeleteTarget] = useState<CompetitionSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompetitions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminCompetitions();
      setCompetitions(data);
    } catch (err) {
      console.error("대회 목록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // 생성
  const handleCreate = async () => {
    if (!createForm.title || !createForm.startDate || !createForm.endDate) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const req: CompetitionCreateRequest = {
        title: createForm.title.trim(),
        startDate: createForm.startDate,
        endDate: createForm.endDate,
      };
      await createCompetition(req);
      setCreateOpen(false);
      setCreateForm(emptyForm);
      await fetchCompetitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  // 수정 열기
  const openEdit = (comp: CompetitionSummary) => {
    setEditTarget(comp);
    setEditForm({
      title: comp.title,
      startDate: comp.startDate,
      endDate: comp.endDate,
    });
    setError(null);
  };

  // 수정 확인
  const handleEdit = async () => {
    if (!editTarget) return;
    setIsEditing(true);
    setError(null);
    try {
      const req: CompetitionUpdateRequest = {
        title: editForm.title.trim() || undefined,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
      };
      const updated = await updateCompetition(editTarget.id, req);
      setCompetitions((prev) =>
        prev.map((c) =>
          c.id === editTarget.id
            ? { ...c, title: updated.title, startDate: updated.startDate, endDate: updated.endDate, status: updated.status }
            : c
        )
      );
      setEditTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setIsEditing(false);
    }
  };

  // 삭제 확인
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCompetition(deleteTarget.id);
      setCompetitions((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">대회 관리</h1>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setCreateForm(emptyForm);
              setError(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            대회 추가
          </Button>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : competitions.length === 0 ? (
          <Card className="border-border/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Trophy className="h-14 w-14 mb-3 opacity-30" />
              <p className="font-medium">등록된 대회가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {competitions.map((comp) => {
              const status = STATUS_LABEL[comp.status] ?? STATUS_LABEL.FINISHED;
              return (
                <Card
                  key={comp.id}
                  className="border-border/50 bg-card cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() =>
                    router.push(`/admin/competitions/${comp.id}`)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      {/* 왼쪽 정보 */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {comp.title}
                          </span>
                          <Badge
                            className={`text-xs border ${status.className}`}
                          >
                            {status.label}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            팀 {comp.teamCount}개
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarRange className="h-3.5 w-3.5" />
                          {comp.startDate} ~ {comp.endDate}
                        </div>
                      </div>

                      {/* 오른쪽 버튼 + 화살표 */}
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => openEdit(comp)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(comp)}
                          disabled={comp.teamCount > 0}
                          title={
                            comp.teamCount > 0
                              ? "팀이 있는 대회는 삭제 불가"
                              : "삭제"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 생성 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>대회 추가</DialogTitle>
            <DialogDescription>새 대회 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>대회명</Label>
              <Input
                placeholder="예: 2026 봄 러닝 대회"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>시작일</Label>
              <Input
                type="date"
                value={createForm.startDate}
                onChange={(e) =>
                  setCreateForm({ ...createForm, startDate: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>종료일</Label>
              <Input
                type="date"
                value={createForm.endDate}
                onChange={(e) =>
                  setCreateForm({ ...createForm, endDate: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 Dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>대회 수정</DialogTitle>
            <DialogDescription>변경할 내용만 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>대회명</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>시작일</Label>
              <Input
                type="date"
                value={editForm.startDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, startDate: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>종료일</Label>
              <Input
                type="date"
                value={editForm.endDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, endDate: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              취소
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleEdit}
              disabled={isEditing}
            >
              {isEditing ? "수정 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              대회 삭제
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">
                {deleteTarget?.title}
              </span>
              을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
