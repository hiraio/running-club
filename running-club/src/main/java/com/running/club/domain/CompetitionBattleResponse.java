package com.running.club.domain;

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
    private String  endDate;        // "yyyy-MM-dd" — D-Day 계산은 프론트에서
    private long    daysRemaining;  // 음수면 대회 종료 후

    /** 팀 배틀 — totalKm 내림차순, 1위 팀이 index 0 */
    private List<TeamSummaryDTO> teams;

    /** 전체 조 기여도 랭킹 — 팀 구분 없이 totalKm 내림차순 */
    private List<GroupContributionDTO> groupRankings;

    /** 오늘의 MVP — 당일 APPROVED 기록 없으면 null */
    private TodayMvpDTO todayMvp;
}
