"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
import remarkGfm from "remark-gfm";
import { getNotices, getNotice, createNotice, updateNotice, deleteNotice } from "@/lib/api";
import type { NoticeSummary, NoticeCreateRequest, NoticeUpdateRequest } from "@/lib/types";
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
import { Bell, Plus, Trash2, Pin, Pencil, Eye, FileText } from "lucide-react";

type FormState = { title: string; content: string; isPinned: boolean };
const emptyForm: FormState = { title: "", content: "", isPinned: false };

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 생성/수정 Dialog (통합)
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // null=생성, number=수정
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

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

  // 생성 다이얼로그 열기
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setPreviewMode(false);
    setFormOpen(true);
  };

  // 수정 다이얼로그 열기 (상세 조회 후 폼 채우기)
  const openEdit = async (id: number) => {
    setEditingId(id);
    setForm(emptyForm);
    setFormError(null);
    setPreviewMode(false);
    setIsLoadingDetail(true);
    setFormOpen(true);
    try {
      const detail = await getNotice(id);
      setForm({ title: detail.title, content: detail.content, isPinned: detail.isPinned });
    } catch {
      setFormError("공지사항을 불러올 수 없습니다.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("제목과 내용을 입력해주세요.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        const req: NoticeUpdateRequest = {
          title: form.title.trim(),
          content: form.content.trim(),
          isPinned: form.isPinned,
        };
        await updateNotice(editingId, req);
      } else {
        const req: NoticeCreateRequest = {
          title: form.title.trim(),
          content: form.content.trim(),
          isPinned: form.isPinned,
        };
        await createNotice(req);
      }
      setFormOpen(false);
      setForm(emptyForm);
      await fetchNotices();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
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
            onClick={openCreate}
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

                    {/* 수정/삭제 버튼 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(notice.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(notice);
                        }}
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

      {/* 생성/수정 통합 Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "공지 수정" : "공지 작성"}</DialogTitle>
            <DialogDescription>
              {editingId ? "공지사항 내용을 수정하세요." : "새 공지사항 내용을 입력하세요."}
              {" "}마크다운 문법을 지원합니다.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>제목</Label>
                <Input
                  placeholder="공지 제목"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>내용</Label>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(false)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        !previewMode
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileText className="h-3 w-3" />
                      작성
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(true)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        previewMode
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      미리보기
                    </button>
                  </div>
                </div>

                {previewMode ? (
                  <div className="min-h-[160px] rounded-md border border-border bg-background px-3 py-2">
                    {form.content.trim() ? (
                      <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:text-foreground prose-headings:font-bold
                        prose-p:text-muted-foreground prose-p:leading-relaxed
                        prose-strong:text-foreground prose-strong:font-semibold
                        prose-em:text-blue-300
                        prose-a:text-blue-400 prose-a:underline
                        prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                        prose-blockquote:border-l-blue-500/50 prose-blockquote:text-muted-foreground
                        prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                        prose-li:marker:text-blue-400
                        prose-hr:border-border/50
                      ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {form.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        내용을 입력하면 미리보기가 표시됩니다.
                      </p>
                    )}
                  </div>
                ) : (
                  <textarea
                    placeholder={"마크다운을 지원합니다.\n\n예시:\n## 제목\n**굵게** *기울임*\n- 목록 항목\n> 인용문"}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={8}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
                  />
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="accent-primary h-4 w-4"
                />
                <span className="text-sm text-foreground">상단 고정</span>
              </label>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={isSaving || isLoadingDetail}
            >
              {isSaving ? "저장 중..." : editingId ? "수정" : "등록"}
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
