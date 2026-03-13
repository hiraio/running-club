package com.running.club.domain;

import lombok.Builder;
import lombok.Getter;

/**
 * 팀 생성/수정 단건 응답 DTO.
 * 그룹 목록은 별도 엔드포인트(GET /api/admin/teams/{id}/groups)로 조회.
 */
@Getter
@Builder
public class TeamResponse {

    private Integer id;
    private Integer competitionId;
    private String teamName;
    private String colorCode;
    private Double totalKm;

    public static TeamResponse from(Team team) {
        return TeamResponse.builder()
                .id(team.getId())
                .competitionId(team.getCompetition().getId())
                .teamName(team.getTeamName())
                .colorCode(team.getColorCode())
                .totalKm(team.getTotalKm())
                .build();
    }
}
