package com.running.club.domain;

import lombok.Getter;

@Getter
public class RankingDTO {

    private Integer rank;        // 서비스에서 순위 계산 후 주입
    private Integer entityId;    // team/group/member id
    private String name;         // team명 / group명 / 회원명
    private Double totalDistance;
    private Long recordCount;

    // JPQL SELECT NEW 생성자 (rank 제외 - 순위는 서비스에서 계산)
    public RankingDTO(Integer entityId, String name, Double totalDistance, Long recordCount) {
        this.entityId = entityId;
        this.name = name;
        this.totalDistance = totalDistance;
        this.recordCount = recordCount;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }
}
