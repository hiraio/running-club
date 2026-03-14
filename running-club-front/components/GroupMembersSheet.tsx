"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getGroupMembers } from "@/lib/api";
import type { GroupMemberDTO } from "@/lib/types";

interface Props {
  groupId: number | null;
  groupName?: string;
  teamColorCode?: string | null;
  myMemberId?: number;
  onClose: () => void;
  onSelectMember: (memberId: number) => void;
}

export default function GroupMembersSheet({
  groupId, groupName, teamColorCode, myMemberId, onClose, onSelectMember,
}: Props) {
  const [members, setMembers] = useState<GroupMemberDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const color = teamColorCode ?? "#8B5CF6";

  useEffect(() => {
    if (!groupId) { setMembers([]); return; }
    setLoading(true);
    getGroupMembers(groupId)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  return (
    <Sheet open={groupId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-base font-bold">
            {groupName ? `${groupName} 멤버` : "조 멤버 목록"}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">멤버가 없습니다.</p>
            ) : (
              members.map((m, i) => {
                const isMe = m.memberId === myMemberId;
                return (
                  <button
                    key={m.memberId}
                    className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-colors
                      ${isMe
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-border/30 bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    onClick={() => {
                      onClose();
                      onSelectMember(m.memberId);
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-muted-foreground w-5 text-center shrink-0">
                        {i + 1}
                      </span>
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
                      >
                        {m.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          {m.name}
                          {isMe && (
                            <span className="text-[10px] font-black rounded-full px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30">나</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{m.totalRuns}회 · {m.memberRank > 0 ? `전체 ${m.memberRank}위` : "기록 없음"}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold" style={{ color }}>{m.totalDistance.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground ml-1">km</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
