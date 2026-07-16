package com.running.club.dto.member;

import com.running.club.dto.record.RunningRecordDTO;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * GET /api/members/{id}/profile 응답 DTO.
 * 다른 회원의 대시보드를 읽기 전용으로 조회할 때 반환.
 * loginId / phone 등 민감 정보는 포함하지 않음.
 */
@Getter
@Builder
public class MemberPublicProfileResponse {

    private Integer memberId;
    private String name;
    private String teamName;
    private String teamColorCode;
    private String groupName;

    // ── 프로필 (member_profiles) ─────────────────────────────────
    private String school;
    private String major;
    private String bio;
    private Double targetDistance;

    // ── 달리기 통계 (APPROVED 기준) ────────────────────────────────
    private double totalDistance;
    private long totalRuns;
    /** 전체 멤버 중 개인 순위. 0 = 기록 없음. */
    private int memberRank;

    // ── 최근 기록 (최대 5건, APPROVED 날짜 내림차순) ────────────────
    private List<RunningRecordDTO> recentRecords;
}
