"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getAdminGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "@/lib/api";
import type {
  GroupDetail,
  GroupCreateRequest,
  GroupUpdateRequest,
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
import { Users, Plus, Pencil, Trash2, ChevronLeft } from "lucide-react";

export default function AdminGroupsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const teamId = Number(id);

  const [groups, setGroups] = useState<GroupDetail[]>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<GroupDetail | null>(null);
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<GroupDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminGroups(teamId);
      setGroups(data);
      if (data.length > 0) setTeamName(data[0].teamName);
    } catch (err) {
      console.error("조 목록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreate = async () => {
    if (!createName.trim()) {
      setError("조 이름을 입력해주세요.");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const req: GroupCreateRequest = { groupName: createName.trim() };
      const created = await createGroup(teamId, req);
      setGroups((prev) => [...prev, created]);
      if (!teamName) setTeamName(created.teamName);
      setCreateOpen(false);
      setCreateName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (group: GroupDetail) => {
    setEditTarget(group);
    setEditName(group.groupName);
    setError(null);
  };

  const handleEdit = async () => {
    if (!editTarget || !editName.trim()) return;
    setIsEditing(true);
    setError(null);
    try {
      const req: GroupUpdateRequest = { groupName: editName.trim() };
      const updated = await updateGroup(editTarget.id, req);
      setGroups((prev) =>
        prev.map((g) => (g.id === editTarget.id ? updated : g))
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
      await deleteGroup(deleteTarget.id);
      setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
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
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {teamName ? `${teamName} 팀` : "팀 목록"}
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">조 관리</h1>
                {teamName && (
                  <p className="text-sm text-muted-foreground">{teamName}</p>
                )}
              </div>
            </div>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setCreateName("");
                setError(null);
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              조 추가
            </Button>
          </div>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="border-border/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-14 w-14 mb-3 opacity-30" />
              <p className="font-medium">등록된 조가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.id} className="border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">
                      {group.groupName}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(group)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(group)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
            <DialogTitle>조 추가</DialogTitle>
            <DialogDescription>새 조 이름을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>조 이름</Label>
            <Input
              placeholder="예: 1조"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="bg-background border-border"
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            />
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
            <DialogTitle>조 수정</DialogTitle>
            <DialogDescription>변경할 조 이름을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>조 이름</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-background border-border"
              onKeyDown={(e) => { if (e.key === "Enter") handleEdit(); }}
            />
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
              조 삭제
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">
                {deleteTarget?.groupName}
              </span>
              을(를) 삭제합니다. 소속 멤버가 있으면 삭제할 수 없습니다.
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
