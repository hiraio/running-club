package com.running.club.domain;

import lombok.Getter;

/**
 * 팀 목록 조회용 JPQL Projection DTO.
 * JPQL의 COUNT() 집계를 포함하므로 엔티티로 조회 불가 → DTO Projection 전용.
 */
@Getter
public class TeamSummaryDTO {

    private final Integer id;
    private final String teamName;
    private final String colorCode;
    private final Double totalKm;
    private final Long groupCount; // 소속 조 수

    /** JPQL DTO Projection 전용 생성자 — 필드 순서와 타입이 쿼리와 일치해야 함 */
    public TeamSummaryDTO(Integer id, String teamName, String colorCode,
                          Double totalKm, Long groupCount) {
        this.id = id;
        this.teamName = teamName;
        this.colorCode = colorCode;
        this.totalKm = totalKm;
        this.groupCount = groupCount;
    }
}
