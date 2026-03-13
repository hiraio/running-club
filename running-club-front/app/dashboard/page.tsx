import { Dashboard } from "@/components/Dashboard";
import type { RankingItem, RunningRecord } from "@/lib/types";

// 샘플 데이터 (실제 사용 시 API에서 fetch)
const sampleRankings: RankingItem[] = [
  { rank: 1, entityId: 101, name: "김철수", totalDistance: 62.35, recordCount: 8 },
  { rank: 2, entityId: 102, name: "이영희", totalDistance: 55.20, recordCount: 7 },
  { rank: 3, entityId: 103, name: "박민준", totalDistance: 48.75, recordCount: 6 },
  { rank: 4, entityId: 104, name: "최서연", totalDistance: 42.10, recordCount: 5 },
  { rank: 5, entityId: 105, name: "정도윤", totalDistance: 38.50, recordCount: 5 },
];

const sampleRecords: RunningRecord[] = [
  {
    id: 1,
    distance: 8.52,
    duration: 2760, // 46분
    runningDate: "2026-03-13",
    status: "APPROVED",
    photoUrl: null,
    comment: "아침 러닝",
    createdAt: "2026-03-13T07:30:00",
    userName: "박민준",
    teamName: "Alpha Team",
    groupName: "A조",
  },
  {
    id: 2,
    distance: 5.23,
    duration: 1680, // 28분
    runningDate: "2026-03-12",
    status: "APPROVED",
    photoUrl: null,
    comment: "점심 조깅",
    createdAt: "2026-03-12T12:15:00",
    userName: "김철수",
    teamName: "Alpha Team",
    groupName: "B조",
  },
  {
    id: 3,
    distance: 10.05,
    duration: 3300, // 55분
    runningDate: "2026-03-11",
    status: "APPROVED",
    photoUrl: null,
    comment: "저녁 장거리",
    createdAt: "2026-03-11T18:45:00",
    userName: "이영희",
    teamName: "Beta Team",
    groupName: null,
  },
  {
    id: 4,
    distance: 6.80,
    duration: 2100, // 35분
    runningDate: "2026-03-10",
    status: "APPROVED",
    photoUrl: null,
    comment: null,
    createdAt: "2026-03-10T06:00:00",
    userName: "최서연",
    teamName: "Alpha Team",
    groupName: "A조",
  },
  {
    id: 5,
    distance: 7.15,
    duration: 2340, // 39분
    runningDate: "2026-03-09",
    status: "APPROVED",
    photoUrl: null,
    comment: "공원 코스",
    createdAt: "2026-03-09T17:20:00",
    userName: "박민준",
    teamName: "Alpha Team",
    groupName: "A조",
  },
];

export default function DashboardPage() {
  return (
    <Dashboard
      weeklyTotalDistance={48.75}
      weeklyDistanceDelta={5.32}
      rankings={sampleRankings}
      currentUserId={103} // 박민준을 현재 사용자로 설정
      recentRecords={sampleRecords}
    />
  );
}
