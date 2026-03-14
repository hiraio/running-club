package com.running.club.domain;

import lombok.Getter;
import lombok.Setter;

/** PUT /api/me/profile 요청 바디 — 모든 필드 선택 사항 (null = 기존 값 유지). */
@Getter
@Setter
public class MemberProfileRequest {
    private String school;
    private String major;
    private String bio;
    private Double targetDistance;
    private String profileImageUrl;
}
