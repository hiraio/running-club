package com.running.club.dto.notice;

import com.running.club.domain.Notice;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

/**
 * 공지사항 단건 응답 DTO.
 * 정적 팩토리 from(Notice)로 생성.
 */
@Getter
@Builder
public class NoticeResponse {
    private Integer id;
    private String title;
    private String content;
    private Boolean isPinned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoticeResponse from(Notice notice) {
        return NoticeResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .isPinned(notice.getIsPinned())
                .createdAt(notice.getCreatedAt())
                .updatedAt(notice.getUpdatedAt())
                .build();
    }
}
