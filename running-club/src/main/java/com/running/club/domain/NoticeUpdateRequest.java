package com.running.club.domain;

import lombok.Getter;

/**
 * 공지사항 수정 요청 DTO (PATCH — 모든 필드 선택적).
 * null 필드는 기존 값 유지 (Notice.update() 도메인 메서드 의미론).
 */
@Getter
public class NoticeUpdateRequest {
    private String title;
    private String content;
    private Boolean isPinned;
}
