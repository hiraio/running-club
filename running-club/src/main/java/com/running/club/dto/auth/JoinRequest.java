package com.running.club.dto.auth;

import lombok.Getter;
import lombok.Setter;

/**
 * POST /join 요청 바디 DTO.
 *
 * <p>groupId(조 ID)를 선택하면 팀은 자동으로 결정됨.
 * teamId는 더 이상 받지 않음 — 조 → 팀 → 대회 계층으로 자동 도출.
 */
@Getter
@Setter
public class JoinRequest {

    private String loginId;
    private String password;
    private String name;

    /** 소속 조 ID (필수). 조 → 팀 → 대회 자동 도출. */
    private Integer groupId;
}
