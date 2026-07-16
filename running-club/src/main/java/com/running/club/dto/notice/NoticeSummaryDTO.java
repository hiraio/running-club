package com.running.club.dto.notice;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 공지사항 목록용 경량 DTO (JPQL Constructor Expression).
 * content 제외 — 목록에서는 제목/고정여부/날짜만 노출.
 */
@Getter
@AllArgsConstructor
public class NoticeSummaryDTO {
    private Integer id;
    private String title;
    private Boolean isPinned;
    private LocalDateTime createdAt;
}
