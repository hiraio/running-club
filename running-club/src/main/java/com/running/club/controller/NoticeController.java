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

/**
 * 공지사항 공개 조회 컨트롤러.
 * 인증 불필요 (SecurityConfig: /api/notices/** permitAll).
 */
@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public ApiResponse<List<NoticeSummaryDTO>> getAll() {
        return ApiResponse.ok(noticeService.getAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<NoticeResponse> getOne(@PathVariable Integer id) {
        return ApiResponse.ok(noticeService.getOne(id));
    }
}
