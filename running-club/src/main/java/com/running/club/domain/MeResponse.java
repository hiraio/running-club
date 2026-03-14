package com.running.club.domain;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MeResponse {

    private Integer id;
    private String loginId;
    private String name;
    private String role;           // "USER" | "ADMIN"
    private boolean needsSetup;    // loginId 또는 password 미설정 시 true
    private Integer groupId;       // 조 미배정 시 null
    private String groupName;      // 조 미배정 시 null
    private Integer teamId;        // 팀 미배정 시 null (WelcomeOverlay 팀 테마용)
    private String teamName;       // 팀 미배정 시 null
    private String teamColorCode;  // 팀 색상 코드 null 가능 (예: "#3B82F6")
}
