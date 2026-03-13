package com.running.club.domain;

import lombok.Getter;

/**
 * 회원가입 화면 - 조 선택 단계용 DTO.
 * 팀 컨텍스트는 이미 이전 단계에서 선택됐으므로 최소 정보만 포함.
 */
@Getter
public class GroupForJoinDTO {

    private final Integer id;
    private final String groupName;

    /** JPQL DTO Projection 전용 생성자 */
    public GroupForJoinDTO(Integer id, String groupName) {
        this.id = id;
        this.groupName = groupName;
    }
}
