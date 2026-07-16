package com.running.club.dto.auth;

import lombok.Builder;
import lombok.Getter;

/**
 * POST /join 성공 응답 DTO.
 *
 * <p>가입 완료된 회원의 핵심 정보만 반환.
 * password, role 등 민감/내부 필드는 의도적으로 제외.
 * groupName은 조 미배정 시 null — 프론트에서 "조 미배정" 처리.
 */
@Getter
@Builder
public class JoinResponse {

    private Integer memberId;
    private String loginId;
    private String name;
    private String teamName;

    /** null = 조 미배정 상태로 가입 완료 */
    private String groupName;
}
