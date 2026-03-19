package com.running.club.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.Notice;
import com.running.club.domain.NoticeCreateRequest;
import com.running.club.domain.NoticeResponse;
import com.running.club.domain.NoticeSummaryDTO;
import com.running.club.domain.NoticeUpdateRequest;
import com.running.club.repository.NoticeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;

    // ════════════════════════════════════════════════════════════════
    // GET /api/notices  — 공개
    // ════════════════════════════════════════════════════════════════

    public List<NoticeSummaryDTO> getAll() {
        return noticeRepository.findAllSummary();
    }

    // ════════════════════════════════════════════════════════════════
    // GET /api/notices/{id}  — 공개
    // ════════════════════════════════════════════════════════════════

    public NoticeResponse getOne(Integer id) {
        Notice notice = noticeRepository.findByNoticeId(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공지사항입니다. (id=" + id + ")"));
        return NoticeResponse.from(notice);
    }

    // ════════════════════════════════════════════════════════════════
    // POST /api/admin/notices  — 관리자
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public NoticeResponse create(NoticeCreateRequest request) {
        log.info("[NOTICE-SVC] 공지사항 생성 - title={}, isPinned={}", request.getTitle(), request.getIsPinned());
        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(request.getIsPinned() != null ? request.getIsPinned() : false)
                .build();
        Notice saved = noticeRepository.save(notice);
        log.info("[NOTICE-SVC] 공지사항 생성 완료 - id={}", saved.getId());
        return NoticeResponse.from(saved);
    }

    // ════════════════════════════════════════════════════════════════
    // PATCH /api/admin/notices/{id}  — 관리자
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public NoticeResponse update(Integer id, NoticeUpdateRequest request) {
        log.info("[NOTICE-SVC] 공지사항 수정 - id={}", id);
        Notice notice = noticeRepository.findByNoticeId(id)
                .orElseThrow(() -> {
                    log.warn("[NOTICE-SVC] 수정 대상 공지사항 없음 - id={}", id);
                    return new IllegalArgumentException("존재하지 않는 공지사항입니다. (id=" + id + ")");
                });
        notice.update(request.getTitle(), request.getContent(), request.getIsPinned());
        log.info("[NOTICE-SVC] 공지사항 수정 완료 - id={}", id);
        // 더티 체킹으로 자동 반영 — save() 재호출 불필요
        return NoticeResponse.from(notice);
    }

    // ════════════════════════════════════════════════════════════════
    // DELETE /api/admin/notices/{id}  — 관리자
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public void delete(Integer id) {
        log.info("[NOTICE-SVC] 공지사항 삭제 - id={}", id);
        Notice notice = noticeRepository.findByNoticeId(id)
                .orElseThrow(() -> {
                    log.warn("[NOTICE-SVC] 삭제 대상 공지사항 없음 - id={}", id);
                    return new IllegalArgumentException("존재하지 않는 공지사항입니다. (id=" + id + ")");
                });
        noticeRepository.delete(notice);
        log.info("[NOTICE-SVC] 공지사항 삭제 완료 - id={}", id);
    }
}
