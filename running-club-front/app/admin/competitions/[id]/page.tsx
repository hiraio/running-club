"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getAdminTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "@/lib/api";
import type {
  TeamSummary,
  TeamCreateRequest,
  TeamUpdateRequest,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";

type FormState = { teamName: string; colorCode: string };
const emptyForm: FormState = { teamName: "", colorCode: "#39FF14" };

export default function AdminTeamsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const competitionId = Number(id);

  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<TeamSummary | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TeamSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminTeams(competitionId);
      setTeams(data);
    } catch (err) {
      console.error("팀 목록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreate = async () => {
    if (!createForm.teamName.trim()) {
      setError("팀 이름을 입력해주세요.");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const req: TeamCreateRequest = {
        teamName: createForm.teamName.trim(),
        colorCode: createForm.colorCode || undefined,
      };
      const created = await createTeam(competitionId, req);
      setTeams((prev) => [
        ...prev,
        { ...created, groupCount: 0, totalKm: 0 },
      ]);
      setCreateOpen(false);
      setCreateForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (team: TeamSummary) => {
    setEditTarget(team);
    setEditForm({
      teamName: team.teamName,
      colorCode: team.colorCode ?? "#39FF14",
    });
    setError(null);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setIsEditing(true);
    setError(null);
    try {
      const req: TeamUpdateRequest = {
        teamName: editForm.teamName.trim() || undefined,
        colorCode: editForm.colorCode || undefined,
      };
      const updated = await updateTeam(editTarget.id, req);
      setTeams((prev) =>
        prev.map((t) => (t.id === editTarget.id ? { ...t, ...updated } : t))
      );
      setEditTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTeam(deleteTarget.id);
      setTeams((prev) => prev.filter((t) => t.id !== deleteTarget.id));
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
        <div className="space-y-3">
          <button
            onClick={() => router.push("/admin/competitions")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            대회 목록
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">팀 관리</h1>
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
              팀 추가
            </Button>
          </div>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <Card className="border-border/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-14 w-14 mb-3 opacity-30" />
              <p className="font-medium">등록된 팀이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="border-border/50 bg-card cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => router.push(`/admin/teams/${team.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    {/* 왼쪽 */}
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full shrink-0 border border-border/50"
                        style={{
                          backgroundColor: team.colorCode ?? "#39FF14",
                        }}
                      />
                      <div>
                        <p className="font-semibold text-foreground">
                          {team.teamName}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>조 {team.groupCount}개</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {team.totalKm.toFixed(1)} km
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽 버튼 */}
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(team)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(team)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 생성 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>팀 추가</DialogTitle>
            <DialogDescription>새 팀 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>팀 이름</Label>
              <Input
                placeholder="예: 청팀"
                value={createForm.teamName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, teamName: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>팀 색상</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={createForm.colorCode}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, colorCode: e.target.value })
                  }
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background"
                />
                <span className="text-sm text-muted-foreground">
                  {createForm.colorCode}
                </span>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
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
            <DialogTitle>팀 수정</DialogTitle>
            <DialogDescription>변경할 내용을 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>팀 이름</Label>
              <Input
                value={editForm.teamName}
                onChange={(e) =>
                  setEditForm({ ...editForm, teamName: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>팀 색상</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editForm.colorCode}
                  onChange={(e) =>
                    setEditForm({ ...editForm, colorCode: e.target.value })
                  }
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background"
                />
                <span className="text-sm text-muted-foreground">
                  {editForm.colorCode}
                </span>
              </div>
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
              팀 삭제
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">
                {deleteTarget?.teamName}
              </span>
              을(를) 삭제합니다. 소속 조도 함께 삭제됩니다.
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
