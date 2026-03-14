package com.running.club.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.domain.ApiResponse;
import com.running.club.domain.NoticeResponse;
import com.running.club.domain.NoticeSummaryDTO;
import com.running.club.service.NoticeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공지사항 공개 조회 컨트롤러.
 *
 * <p>인증 불필요 (SecurityConfig: /api/notices/** permitAll).
 * 모든 응답은 ApiResponse<T> 래퍼로 일관성 유지.
 */
@Slf4j
@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    // ════════════════════════════════════════════════════════════════
    // GET /api/notices
    // ════════════════════════════════════════════════════════════════

    @GetMapping
    public ApiResponse<List<NoticeSummaryDTO>> getAll() {
        log.info("[NOTICE-CTRL] 공지사항 목록 조회 요청");
        return ApiResponse.ok(noticeService.getAll());
    }

    // ════════════════════════════════════════════════════════════════
    // GET /api/notices/{id}
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/{id}")
    public ApiResponse<NoticeResponse> getOne(@PathVariable Integer id) {
        log.info("[NOTICE-CTRL] 공지사항 단건 조회 요청 - id={}", id);
        return ApiResponse.ok(noticeService.getOne(id));
    }
}
