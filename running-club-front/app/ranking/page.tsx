"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, User, Medal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RankingItem, CompetitionForJoin } from "@/lib/types";
import {
  getTeamRanking,
  getGroupRanking,
  getMemberRanking,
  getActiveCompetitions,
} from "@/lib/api";

type RankingType = "team" | "group" | "member";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
        <Medal className="mr-1 h-3 w-3" />
        1st
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge className="bg-gray-300 text-gray-800 hover:bg-gray-300">
        <Medal className="mr-1 h-3 w-3" />
        2nd
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge className="bg-amber-600 text-amber-50 hover:bg-amber-600">
        <Medal className="mr-1 h-3 w-3" />
        3rd
      </Badge>
    );
  }
  return <span className="text-muted-foreground">{rank}</span>;
}

function RankingTable({
  data,
  isLoading,
}: {
  data: RankingItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Trophy className="mb-2 h-12 w-12 opacity-50" />
        <p>아직 랭킹 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50 hover:bg-transparent">
          <TableHead className="w-20">순위</TableHead>
          <TableHead>이름</TableHead>
          <TableHead className="text-right">총 거리</TableHead>
          <TableHead className="text-right">기록 수</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow
            key={item.entityId}
            className={`border-border/30 ${
              item.rank <= 3 ? "bg-primary/5" : ""
            }`}
          >
            <TableCell>
              <RankBadge rank={item.rank} />
            </TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-right">
              <span className="text-primary font-semibold">
                {item.totalDistance.toFixed(2)}
              </span>{" "}
              <span className="text-muted-foreground text-sm">km</span>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {item.recordCount}회
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Mobile-optimized card list for rankings
function MobileRankingCards({
  data,
  isLoading,
}: {
  data: RankingItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Trophy className="mb-2 h-10 w-10 opacity-50" />
        <p className="text-sm">데이터 없음</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((item) => (
        <div
          key={item.entityId}
          className={`flex items-center justify-between rounded-xl border border-border/30 bg-secondary/30 p-3 ${
            item.rank <= 3 ? "border-primary/30 bg-primary/5" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <RankBadge rank={item.rank} />
            <span className="font-medium">{item.name}</span>
          </div>
          <div className="text-right">
            <span className="text-primary font-bold">
              {item.totalDistance.toFixed(2)}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">km</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Mobile section component
function MobileRankingSection({
  title,
  icon: Icon,
  data,
  isLoading,
}: {
  title: string;
  icon: React.ElementType;
  data: RankingItem[];
  isLoading: boolean;
}) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MobileRankingCards data={data} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

export default function RankingPage() {
  const [competitions, setCompetitions] = useState<CompetitionForJoin[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<RankingType>("team");
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompetitionsLoading, setIsCompetitionsLoading] = useState(true);

  // Mobile: separate state for all ranking types
  const [teamRankings, setTeamRankings] = useState<RankingItem[]>([]);
  const [groupRankings, setGroupRankings] = useState<RankingItem[]>([]);
  const [memberRankings, setMemberRankings] = useState<RankingItem[]>([]);
  const [isMobileLoading, setIsMobileLoading] = useState(true);

  // 대회 목록 로드
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await getActiveCompetitions();
        if (res.success) {
          setCompetitions(res.data);
        }
      } catch (error) {
        console.error("대회 목록 로드 실패:", error);
      } finally {
        setIsCompetitionsLoading(false);
      }
    };
    fetchCompetitions();
  }, []);

  // Mobile: fetch all ranking types at once
  useEffect(() => {
    const fetchAllRankings = async () => {
      setIsMobileLoading(true);
      try {
        const competitionId =
          selectedCompetition === "all"
            ? undefined
            : Number(selectedCompetition);

        const [teamData, groupData, memberData] = await Promise.all([
          getTeamRanking(competitionId),
          getGroupRanking(competitionId),
          getMemberRanking(competitionId),
        ]);

        setTeamRankings(teamData);
        setGroupRankings(groupData);
        setMemberRankings(memberData);
      } catch (error) {
        console.error("랭킹 로드 실패:", error);
      } finally {
        setIsMobileLoading(false);
      }
    };
    fetchAllRankings();
  }, [selectedCompetition]);

  // 랭킹 데이터 로드
  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      try {
        const competitionId =
          selectedCompetition === "all"
            ? undefined
            : Number(selectedCompetition);

        let data: RankingItem[];
        switch (activeTab) {
          case "team":
            data = await getTeamRanking(competitionId);
            break;
          case "group":
            data = await getGroupRanking(competitionId);
            break;
          case "member":
            data = await getMemberRanking(competitionId);
            break;
          default:
            data = [];
        }
        setRankings(data);
      } catch (error) {
        console.error("랭킹 로드 실패:", error);
        setRankings([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRankings();
  }, [selectedCompetition, activeTab]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <Trophy className="mr-2 inline-block h-8 w-8 text-primary" />
              랭킹
            </h1>
            <p className="mt-1 text-muted-foreground">
              팀, 조, 개인별 러닝 순위를 확인하세요
            </p>
          </div>

          {/* 대회 필터 */}
          <div className="w-full sm:w-64">
            {isCompetitionsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedCompetition}
                onValueChange={(value) => setSelectedCompetition(value ?? "all")}
              >
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="대회 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 대회</SelectItem>
                  {competitions.map((comp) => (
                    <SelectItem key={comp.id} value={String(comp.id)}>
                      {comp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Ranking Tabs */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-0">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as RankingType)}
            >
              <TabsList className="grid w-full grid-cols-3 bg-secondary">
                <TabsTrigger value="team" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">팀 랭킹</span>
                  <span className="sm:hidden">팀</span>
                </TabsTrigger>
                <TabsTrigger value="group" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">조 랭킹</span>
                  <span className="sm:hidden">조</span>
                </TabsTrigger>
                <TabsTrigger value="member" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">개인 랭킹</span>
                  <span className="sm:hidden">개인</span>
                </TabsTrigger>
              </TabsList>

              <CardContent className="pt-6">
                <TabsContent value="team">
                  <RankingTable data={rankings} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="group">
                  <RankingTable data={rankings} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="member">
                  <RankingTable data={rankings} isLoading={isLoading} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
