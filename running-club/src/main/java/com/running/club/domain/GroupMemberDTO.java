package com.running.club.domain;

import lombok.Builder;
import lombok.Getter;

/**
 * GET /api/groups/{id}/members 응답 DTO — 조 멤버 한 명의 요약 정보.
 */
@Getter
@Builder
public class GroupMemberDTO {

    private Integer memberId;
    private String name;
    private double totalDistance;
    private long totalRuns;
    /** 전체 멤버 중 순위. 0 = 기록 없음. */
    private int memberRank;
}
