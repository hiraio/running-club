package com.running.club.dto.competition;

import com.running.club.dto.ranking.GroupContributionDTO;
import com.running.club.dto.record.TodayMvpDTO;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * GET /api/competitions/active/battle 응답 DTO.
 * 팀 배틀 현황 + 전체 조별 기여도 + 오늘의 MVP를 단일 호출로 반환.
 * 인증 불필요(permitAll) — SecurityConfig /api/competitions/** 허용 범위 적용.
 */
@Getter
@Builder
public class CompetitionBattleResponse {

    private Integer competitionId;
    private String  title;
    private String  status;         // "PROCEEDING" | "READY"
    private String  endDate;        // "yyyy-MM-dd"
    private String  startDate;      // "yyyy-MM-dd" — READY 상태일 때 카운트다운용
    private long    daysRemaining;  // 음수면 대회 종료 후
    private long    daysUntilStart; // READY 상태: 시작까지 남은 일수 (PROCEEDING이면 0)

    /** 팀 배틀 — totalKm 내림차순, 1위 팀이 index 0 */
    private List<TeamSummaryDTO> teams;

    /** 전체 조 기여도 랭킹 — 팀 구분 없이 totalKm 내림차순 */
    private List<GroupContributionDTO> groupRankings;

    /** 오늘의 MVP — 당일 APPROVED 기록 없으면 null */
    private TodayMvpDTO todayMvp;
}
