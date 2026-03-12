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

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/records")
public class AdminRecordController {

    private final AdminRecordService adminRecordService;

    @GetMapping("/waiting")
    public ResponseEntity<List<RunningRecordDTO>> getWaitingRecords() {
        return ResponseEntity.ok(adminRecordService.getWaitingRecords());
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<String> approve(@PathVariable Integer id,
                                          @AuthenticationPrincipal CustomUserDetails userDetails) {
        adminRecordService.approve(id, userDetails.getMember());
        return ResponseEntity.ok("기록 #" + id + " 승인 완료");
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<String> reject(@PathVariable Integer id,
                                         @RequestParam String reason,
                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        adminRecordService.reject(id, reason, userDetails.getMember());
        return ResponseEntity.ok("기록 #" + id + " 거절 완료");
    }
}
