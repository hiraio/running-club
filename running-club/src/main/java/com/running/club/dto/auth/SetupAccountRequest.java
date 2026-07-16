package com.running.club.dto.auth;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SetupAccountRequest {
    private String loginId;
    private String password;
    /** 모바일 크로스도메인 쿠키 차단 대비 — 세션 없이도 본인 확인 가능하도록 */
    private String name;
    private String phone;
}
