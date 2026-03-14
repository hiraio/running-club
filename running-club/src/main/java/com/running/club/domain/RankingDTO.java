package com.running.club.domain;

import lombok.Getter;

@Getter
public class RankingDTO {

    private Integer rank;         // 서비스에서 순위 계산 후 주입
    private Integer entityId;     // team/group/member id
    private String  name;         // team명 / group명 / 회원명
    private Double  totalDistance;
    private Long    recordCount;

    /**
     * 순위 변동 = previousRank - currentRank.
     * 양수(▲) / 음수(▼) / 0(변동없음) / null(직전 스냅샷 없음 = NEW).
     */
    private Integer rankChange;

    // JPQL SELECT NEW 생성자 (rank, rankChange 제외 - 서비스에서 주입)
    public RankingDTO(Integer entityId, String name, Double totalDistance, Long recordCount) {
        this.entityId = entityId;
        this.name = name;
        this.totalDistance = totalDistance;
        this.recordCount = recordCount;
    }

    public void setRank(Integer rank)             { this.rank = rank; }
    public void setRankChange(Integer rankChange) { this.rankChange = rankChange; }
}
