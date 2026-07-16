package com.running.club.dto.notice;

import lombok.Getter;

/**
 * 공지사항 생성 요청 DTO.
 * isPinned가 null로 오면 서비스에서 false로 처리.
 */
@Getter
public class NoticeCreateRequest {
    private String title;
    private String content;
    private Boolean isPinned;
}
