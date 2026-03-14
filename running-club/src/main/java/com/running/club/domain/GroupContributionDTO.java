package com.running.club.domain;

import lombok.Getter;

/**
 * 조별 기여도 DTO — 팀 정보(teamId, teamName, colorCode) 포함.
 * 대회 현황 페이지의 '통합 조별 기여도 랭킹' 구현용.
 * JPQL Constructor Expression 전용 — rank / isTopContributor 는 서비스에서 주입.
 */
@Getter
public class GroupContributionDTO {

    private Integer rank;
    private Integer groupId;
    private String  groupName;
    private Integer teamId;
    private String  teamName;
    private String  teamColorCode;
    private Double  totalKm;
    private Long    recordCount;
    private boolean isTopContributor;

    /** JPQL SELECT NEW 생성자 — rank/isTopContributor 제외 */
    public GroupContributionDTO(Integer groupId, String groupName,
                                Integer teamId, String teamName, String teamColorCode,
                                Double totalKm, Long recordCount) {
        this.groupId      = groupId;
        this.groupName    = groupName;
        this.teamId       = teamId;
        this.teamName     = teamName;
        this.teamColorCode = teamColorCode;
        this.totalKm      = totalKm;
        this.recordCount  = recordCount;
    }

    public void setRank(Integer rank)               { this.rank = rank; }
    public void setTopContributor(boolean top)      { this.isTopContributor = top; }
}
