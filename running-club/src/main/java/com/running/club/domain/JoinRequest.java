package com.running.club.domain;

import lombok.Getter;
import lombok.Setter;

/**
 * POST /join 요청 바디 DTO.
 *
 * <p>teamId는 필수 — 회원가입 시 반드시 팀을 선택해야 함.
 * groupId는 선택 — 조를 운영하지 않는 팀이거나 아직 조가 구성되지 않은 경우 null 허용.
 */
@Getter
@Setter
public class JoinRequest {

    private String loginId;
    private String password;
    private String name;

    /** 소속 팀 ID (필수). 활성 대회 소속 팀만 유효. */
    private Integer teamId;

    /** 소속 조 ID (선택). null 허용 — 조 미배정 상태로 가입 가능. */
    private Integer groupId;
}
