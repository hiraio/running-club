package com.running.club.domain;

import lombok.Getter;

/**
 * 회원가입 화면 - 팀 선택 단계용 DTO.
 * colorCode를 포함하여 프론트에서 팀 색상 배지를 바로 렌더링할 수 있음.
 */
@Getter
public class TeamForJoinDTO {

    private final Integer id;
    private final String teamName;
    private final String colorCode; // nullable — 색상 미지정 팀도 존재

    /** JPQL DTO Projection 전용 생성자 */
    public TeamForJoinDTO(Integer id, String teamName, String colorCode) {
        this.id = id;
        this.teamName = teamName;
        this.colorCode = colorCode;
    }
}
