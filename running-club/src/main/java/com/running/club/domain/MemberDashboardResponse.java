package com.running.club.domain;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * GET /api/me/dashboard 응답 DTO.
 * member_profiles + running_records JOIN 집계 결과를 한 번에 반환.
 */
@Getter
@Builder
public class MemberDashboardResponse {

    private Integer memberId;
    private String name;
    private String teamName;
    private String teamColorCode;
    private String groupName;

    // ── 프로필 (member_profiles) ─────────────────────────────────────
    private String school;
    private String major;
    private String bio;
    /** 목표 거리 (km). 미설정 시 null. */
    private Double targetDistance;

    // ── 팀 현황 (대시보드 팀 기여 카드) ─────────────────────────────────
    /** 현재 대회 ID — /competition 페이지 링크용. null이면 진행 대회 없음. */
    private Integer competitionId;
    /** 팀의 대회 내 순위. 0 = 기록 없음 / 대회 미참가. */
    private int teamRank;
    /** 팀의 대회 내 누적 km */
    private double teamTotalKm;

    // ── 달리기 통계 (running_records APPROVED 기준) ───────────────────
    /** APPROVED 누적 거리 (km) */
    private double currentDistance;
    /** APPROVED 총 횟수 */
    private long totalRuns;
    /** 전체 멤버 중 개인 랭킹 순위. 0 = 아직 기록 없음. */
    private int memberRank;
    /** 기록 있는 전체 멤버 수 */
    private int totalRankedMembers;

    // ── 최근 기록 (최대 5건) ─────────────────────────────────────────
    private List<RunningRecordDTO> recentRecords;
}
