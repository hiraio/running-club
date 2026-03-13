package com.running.club.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.domain.CustomUserDetails;
import com.running.club.domain.RunningRecordDTO;
import com.running.club.service.AdminRecordService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/records")
public class AdminRecordController {

    private final AdminRecordService adminRecordService;

    @GetMapping("/waiting")
    public ResponseEntity<List<RunningRecordDTO>> getWaitingRecords() {
        log.info("[ADMIN-RECORD] 승인 대기 목록 조회 요청");
        List<RunningRecordDTO> result = adminRecordService.getWaitingRecords();
        log.info("[ADMIN-RECORD] 승인 대기 목록 조회 완료 - 건수={}", result.size());
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<String> approve(@PathVariable Integer id,
                                          @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("[ADMIN-RECORD] 기록 승인 요청 - recordId={}, admin={}", id, userDetails.getUsername());
        adminRecordService.approve(id, userDetails.getMember());
        log.info("[ADMIN-RECORD] 기록 승인 완료 - recordId={}", id);
        return ResponseEntity.ok("기록 #" + id + " 승인 완료");
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<String> reject(@PathVariable Integer id,
                                         @RequestParam String reason,
                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("[ADMIN-RECORD] 기록 반려 요청 - recordId={}, admin={}, reason={}", id, userDetails.getUsername(), reason);
        adminRecordService.reject(id, reason, userDetails.getMember());
        log.info("[ADMIN-RECORD] 기록 반려 완료 - recordId={}", id);
        return ResponseEntity.ok("기록 #" + id + " 거절 완료");
    }
}
