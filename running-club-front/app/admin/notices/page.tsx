"use client";

import { useState, useEffect, useCallback } from "react";
import { getNotices, createNotice, deleteNotice } from "@/lib/api";
import type { NoticeSummary, NoticeCreateRequest } from "@/lib/types";
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
import { Bell, Plus, Trash2, Pin } from "lucide-react";

type FormState = { title: string; content: string; isPinned: boolean };
const emptyForm: FormState = { title: "", content: "", isPinned: false };

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 생성 Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 삭제 Dialog
  const [deleteTarget, setDeleteTarget] = useState<NoticeSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getNotices();
      setNotices(data);
    } catch (err) {
      console.error("공지사항 목록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      setCreateError("제목과 내용을 입력해주세요.");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      const req: NoticeCreateRequest = {
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        isPinned: createForm.isPinned,
      };
      await createNotice(req);
      setCreateOpen(false);
      setCreateForm(emptyForm);
      await fetchNotices();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteNotice(deleteTarget.id);
      setNotices((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">공지사항</h1>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setCreateForm(emptyForm);
              setCreateError(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            공지 작성
          </Button>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <Card className="border-border/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-14 w-14 mb-3 opacity-30" />
              <p className="font-medium">등록된 공지사항이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <Card
                key={notice.id}
                className="border-border/50 bg-card hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    {/* 왼쪽 정보 */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {notice.isPinned && (
                          <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                        <span className="font-semibold text-foreground">
                          {notice.title}
                        </span>
                        {notice.isPinned && (
                          <Badge className="text-xs border bg-primary/20 text-primary border-primary/30">
                            고정
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(notice.createdAt)}
                      </p>
                    </div>

                    {/* 삭제 버튼 */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(notice);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 생성 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>공지 작성</DialogTitle>
            <DialogDescription>새 공지사항 내용을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>제목</Label>
              <Input
                placeholder="공지 제목"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>내용</Label>
              <textarea
                placeholder="공지 내용을 입력하세요..."
                value={createForm.content}
                onChange={(e) =>
                  setCreateForm({ ...createForm, content: e.target.value })
                }
                rows={5}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createForm.isPinned}
                onChange={(e) =>
                  setCreateForm({ ...createForm, isPinned: e.target.checked })
                }
                className="accent-primary h-4 w-4"
              />
              <span className="text-sm text-foreground">상단 고정</span>
            </label>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
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
              {isCreating ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              공지사항 삭제
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">
                {deleteTarget?.title}
              </span>
              을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
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
