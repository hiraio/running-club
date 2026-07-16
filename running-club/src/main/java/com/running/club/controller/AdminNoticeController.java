package com.running.club.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.dto.notice.NoticeCreateRequest;
import com.running.club.dto.notice.NoticeResponse;
import com.running.club.dto.notice.NoticeUpdateRequest;
import com.running.club.service.NoticeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공지사항 관리자 전용 컨트롤러.
 *
 * <p>SecurityConfig: /api/admin/** → hasAuthority("ADMIN") 적용.
 * 관리자 API 일관성에 따라 ResponseEntity 직접 반환.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
public class AdminNoticeController {

    private final NoticeService noticeService;

    // ════════════════════════════════════════════════════════════════
    // POST /api/admin/notices
    // ════════════════════════════════════════════════════════════════

    @PostMapping
    public ResponseEntity<NoticeResponse> create(@RequestBody NoticeCreateRequest request) {
        log.info("[ADMIN-NOTICE-CTRL] 공지사항 생성 요청 - title={}", request.getTitle());
        NoticeResponse response = noticeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ════════════════════════════════════════════════════════════════
    // PATCH /api/admin/notices/{id}
    // ════════════════════════════════════════════════════════════════

    @PatchMapping("/{id}")
    public ResponseEntity<NoticeResponse> update(
            @PathVariable Integer id,
            @RequestBody NoticeUpdateRequest request) {
        log.info("[ADMIN-NOTICE-CTRL] 공지사항 수정 요청 - id={}", id);
        return ResponseEntity.ok(noticeService.update(id, request));
    }

    // ════════════════════════════════════════════════════════════════
    // DELETE /api/admin/notices/{id}
    // ════════════════════════════════════════════════════════════════

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        log.info("[ADMIN-NOTICE-CTRL] 공지사항 삭제 요청 - id={}", id);
        noticeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
