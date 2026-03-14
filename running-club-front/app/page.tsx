import type { CompetitionBattle } from "@/lib/types";
import { BattleCard } from "@/components/BattleCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DynamicGreeting } from "@/components/DynamicGreeting";

async function getBattleData(): Promise<CompetitionBattle | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/competitions/active/battle`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const battleData = await getBattleData();

  return (
    <div className="min-h-screen bg-[#0c0d10] p-4 pb-24 md:p-8 md:pb-8">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* 1. 헤더 & 엔디의 개인화 메시지 */}
        <div className="pt-2 space-y-4">
          <h1 className="text-sm font-bold tracking-widest text-gray-500 uppercase">
            ND Running Club
          </h1>
          <DynamicGreeting battleData={battleData} />
        </div>

        {/* 2. 대회 배틀 카드 (시각적 스코어보드 우선 배치) */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
            <span className="text-blue-500">●</span>
            <h2 className="text-sm font-bold text-gray-400">대회</h2>
          </div>
          <BattleCard data={battleData} />
        </div>

        {/* 3. 최근 활동 피드 */}
  
          <ActivityFeed />

      </div>
    </div>
  );
}