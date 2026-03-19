"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Users, UserCheck, UserX } from "lucide-react";
import {
  getAdminMembers,
  getAdminCompetitions,
  getAdminTeams,
  getAdminGroups,
  assignMember,
} from "@/lib/api";
import type {
  AdminMemberItem,
  CompetitionSummary,
  TeamSummary,
  GroupDetail,
} from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ── 배지 컴포넌트 ─────────────────────────────────────

function AssignBadge({ teamId, groupId }: { teamId: number | null; groupId: number | null }) {
  if (teamId && groupId)
    return <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] hover:bg-green-500/15">배정완료</Badge>;
  if (teamId)
    return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] hover:bg-amber-500/15">팀만</Badge>;
  return <Badge variant="outline" className="text-muted-foreground border-border/50 text-[10px]">미배정</Badge>;
}

function AccountBadge({ needsSetup, loginId }: { needsSetup: boolean; loginId: string | null }) {
  if (!loginId || needsSetup)
    return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] hover:bg-amber-500/15">설정중</Badge>;
  return <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] hover:bg-green-500/15">활성</Badge>;
}

// ── 배정 Sheet ────────────────────────────────────────

function AssignSheet({
  member,
  open,
  competitions,
  onClose,
  onAssigned,
}: {
  member: AdminMemberItem | null;
  open: boolean;
  competitions: CompetitionSummary[];
  onClose: () => void;
  onAssigned: (updated: AdminMemberItem) => void;
}) {
  const [compId, setCompId] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [groups, setGroups] = useState<GroupDetail[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sheet 열릴 때: 활성 대회 자동 선택
  useEffect(() => {
    if (!open || competitions.length === 0) return;
    setError(null);
    setSelectedTeamId(null);
    setSelectedGroupId(null);
    setGroups([]);
    const active = competitions.find((c) => c.status === "PROCEEDING") ?? competitions[0];
    setCompId(active.id);
  }, [open, competitions]);

  // 대회 변경 → 팀 목록 로드
  useEffect(() => {
    if (!compId) return;
    setSelectedTeamId(null);
    setSelectedGroupId(null);
    setGroups([]);
    setTeamsLoading(true);
    getAdminTeams(compId)
      .then(setTeams)
      .finally(() => setTeamsLoading(false));
  }, [compId]);

  // 팀 선택 → 조 목록 로드
  const handleTeamSelect = (teamId: number) => {
    if (selectedTeamId === teamId) return;
    setSelectedTeamId(teamId);
    setSelectedGroupId(null);
    setGroupsLoading(true);
    getAdminGroups(teamId)
      .then(setGroups)
      .finally(() => setGroupsLoading(false));
  };

  const handleSave = async () => {
    if (!member || !selectedTeamId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await assignMember(member.id, {
        teamId: selectedTeamId,
        groupId: selectedGroupId,
      });
      onAssigned(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "배정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!member) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await assignMember(member.id, { teamId: null, groupId: null });
      onAssigned(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "배정 해제 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[340px] sm:w-[400px] bg-card border-l border-border/50 overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-foreground">팀 / 조 배정</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* 회원 정보 */}
          <div className="rounded-lg bg-muted/30 border border-border/30 px-4 py-3">
            <p className="font-semibold text-foreground">{member.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {member.loginId ?? "계정 설정중"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              현재:{" "}
              {member.teamName
                ? `${member.teamName}${member.groupName ? ` · ${member.groupName}` : " (조 미배정)"}`
                : "미배정"}
            </p>
          </div>

          {/* 대회 선택 — 복수일 때만 노출 */}
          {competitions.length > 1 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">대회</p>
              <div className="flex flex-wrap gap-2">
                {competitions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCompId(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      compId === c.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.title}
                    {c.status === "PROCEEDING" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 팀 선택 */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">팀 선택</p>
            {teamsLoading ? (
              <p className="text-xs text-muted-foreground">로딩 중...</p>
            ) : teams.length === 0 ? (
              <p className="text-xs text-muted-foreground">등록된 팀이 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teams.map((t) => {
                  const selected = selectedTeamId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTeamSelect(t.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        selected
                          ? "text-white border-transparent"
                          : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                      }`}
                      style={
                        selected && t.colorCode
                          ? { backgroundColor: t.colorCode, borderColor: t.colorCode }
                          : undefined
                      }
                    >
                      {t.teamName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 조 선택 — 팀 선택 후 표시 */}
          {selectedTeamId && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                조 선택{" "}
                <span className="text-muted-foreground/50 font-normal">(선택 사항)</span>
              </p>
              {groupsLoading ? (
                <p className="text-xs text-muted-foreground">로딩 중...</p>
              ) : groups.length === 0 ? (
                <p className="text-xs text-muted-foreground">등록된 조가 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const selected = selectedGroupId === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() =>
                          setSelectedGroupId(selected ? null : g.id)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selected
                            ? "text-white border-transparent"
                            : "border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                        style={
                          selected && selectedTeam?.colorCode
                            ? {
                                backgroundColor: selectedTeam.colorCode + "bb",
                                borderColor: selectedTeam.colorCode,
                              }
                            : undefined
                        }
                      >
                        {g.groupName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 에러 */}
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={!selectedTeamId || saving}
              className="w-full"
            >
              {saving ? "저장 중..." : "배정하기"}
            </Button>
            {(member.teamId || member.groupId) && (
              <Button
                variant="outline"
                onClick={handleUnassign}
                disabled={saving}
                className="w-full text-muted-foreground border-border/50 hover:text-destructive hover:border-destructive/50"
              >
                배정 해제
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── 메인 페이지 ───────────────────────────────────────

function getAssignPriority(m: AdminMemberItem) {
  if (!m.teamId) return 0;   // 미배정 → 맨 위
  if (!m.groupId) return 1;  // 팀만   → 중간
  return 2;                  // 완료    → 아래
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<AdminMemberItem[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [selectedMember, setSelectedMember] = useState<AdminMemberItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // 회원 + 대회 병렬 로드
  useEffect(() => {
    Promise.all([getAdminMembers(), getAdminCompetitions()])
      .then(([m, c]) => {
        setMembers(m);
        setCompetitions(c);
      })
      .finally(() => setLoading(false));
  }, []);

  // 필터용 팀 목록 (현재 회원 데이터에서 도출)
  const filterTeams = useMemo(() => {
    const map = new Map<number, string>();
    members.forEach((m) => {
      if (m.teamId && m.teamName) map.set(m.teamId, m.teamName);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members]);

  // 팀 선택 시 해당 팀의 조 목록
  const filterGroups = useMemo(() => {
    if (teamFilter === "ALL") return [];
    const tid = Number(teamFilter);
    const map = new Map<number, string>();
    members.forEach((m) => {
      if (m.teamId === tid && m.groupId && m.groupName)
        map.set(m.groupId, m.groupName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [members, teamFilter]);

  const handleTeamFilterChange = (val: string | null) => {
    setTeamFilter(val ?? "ALL");
    setGroupFilter("ALL");
  };

  const stats = useMemo(
    () => ({
      total: members.length,
      full: members.filter((m) => m.teamId && m.groupId).length,
      unassigned: members.filter((m) => !m.teamId).length,
    }),
    [members]
  );

  // 검색 + 필터
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.trim().toLowerCase();
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !(m.loginId?.toLowerCase().includes(q))
      )
        return false;
      if (teamFilter !== "ALL" && m.teamId !== Number(teamFilter)) return false;
      if (groupFilter !== "ALL" && m.groupId !== Number(groupFilter)) return false;
      return true;
    });
  }, [members, search, teamFilter, groupFilter]);

  // 미배정 → 팀만 → 배정완료 순, 각 그룹 내 이름순
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const diff = getAssignPriority(a) - getAssignPriority(b);
      return diff !== 0 ? diff : a.name.localeCompare(b.name, "ko");
    });
  }, [filtered]);

  const openSheet = (m: AdminMemberItem) => {
    setSelectedMember(m);
    setSheetOpen(true);
  };

  // 배정 성공 시 로컬 상태 낙관적 업데이트 (서버 재조회 없음)
  const handleAssigned = (updated: AdminMemberItem) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

      {/* 헤더 */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">회원 관리</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          팀/조 배정 현황 · 행 클릭 또는 배정 버튼으로 배정
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "전체 회원",  value: stats.total,      icon: Users,      color: "text-foreground" },
          { label: "배정완료",   value: stats.full,       icon: UserCheck,  color: "text-green-400" },
          { label: "미배정",     value: stats.unassigned, icon: UserX,      color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-card border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>
                {loading ? "—" : value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="이름 또는 아이디 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border/50"
          />
        </div>
        <Select value={teamFilter} onValueChange={handleTeamFilterChange}>
          <SelectTrigger className="w-32 h-10 text-xs bg-secondary border-border/50">
            <SelectValue placeholder="팀 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 팀</SelectItem>
            {filterTeams.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {teamFilter !== "ALL" && filterGroups.length > 0 && (
          <Select value={groupFilter} onValueChange={(v) => setGroupFilter(v ?? "ALL")}>
            <SelectTrigger className="w-28 h-10 text-xs bg-secondary border-border/50">
              <SelectValue placeholder="조 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 조</SelectItem>
              {filterGroups.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {loading ? "불러오는 중..." : `${sorted.length}명 표시 중 (미배정 우선 정렬)`}
      </p>

      {/* 테이블 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          조건에 맞는 회원이 없습니다.
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">이름</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">아이디</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">전화번호</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">팀</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">조</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">배정</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">계정</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {sorted.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => openSheet(m)}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap hidden md:table-cell">
                      {m.loginId ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap hidden lg:table-cell">
                      {m.phone ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {m.teamName
                        ? <span className="text-foreground text-xs">{m.teamName}</span>
                        : <span className="text-muted-foreground/40 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                      {m.groupName
                        ? <span className="text-foreground text-xs">{m.groupName}</span>
                        : <span className="text-muted-foreground/40 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <AssignBadge teamId={m.teamId} groupId={m.groupId} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                      <AccountBadge needsSetup={m.needsSetup} loginId={m.loginId} />
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-border/50 hover:border-primary/50 hover:text-primary"
                        onClick={() => openSheet(m)}
                      >
                        배정
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 배정 Sheet */}
      <AssignSheet
        member={selectedMember}
        open={sheetOpen}
        competitions={competitions}
        onClose={() => setSheetOpen(false)}
        onAssigned={handleAssigned}
      />
    </div>
  );
}
