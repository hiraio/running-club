package com.running.club.domain;

import lombok.Builder;
import lombok.Getter;

/** 조(RunningGroup) 생성/수정/조회 단건 응답 DTO */
@Getter
@Builder
public class RunningGroupResponse {

    private Integer id;
    private Integer teamId;
    private String teamName;   // 소속 팀 이름 (프론트 조회 편의)
    private String groupName;

    public static RunningGroupResponse from(RunningGroup group) {
        return RunningGroupResponse.builder()
                .id(group.getId())
                .teamId(group.getTeam().getId())
                .teamName(group.getTeam().getTeamName())
                .groupName(group.getGroupName())
                .build();
    }
}
