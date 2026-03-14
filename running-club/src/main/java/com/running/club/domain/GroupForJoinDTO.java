package com.running.club.domain;

import lombok.Getter;

/**
 * 회원가입 화면 - 조 선택 단계용 DTO.
 * 대회 ID 기반 조회 시 팀 컨텍스트(teamId, teamName)도 포함.
 */
@Getter
public class GroupForJoinDTO {

    private final Integer id;
    private final String groupName;
    private final Integer teamId;
    private final String teamName;

    /** 팀 기반 조회용 (팀 컨텍스트 불필요) */
    public GroupForJoinDTO(Integer id, String groupName) {
        this.id = id;
        this.groupName = groupName;
        this.teamId = null;
        this.teamName = null;
    }

    /** 대회 기반 조회용 (팀 컨텍스트 포함) */
    public GroupForJoinDTO(Integer id, String groupName, Integer teamId, String teamName) {
        this.id = id;
        this.groupName = groupName;
        this.teamId = teamId;
        this.teamName = teamName;
    }
}
