package com.running.club.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.dto.bingo.BingoBoardResponse;
import com.running.club.security.CustomUserDetails;
import com.running.club.service.BingoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/bingo")
@RequiredArgsConstructor
public class AdminBingoController {

    private final BingoService bingoService;

    /** 빙고판 생성 */
    @PostMapping("/board")
    public ResponseEntity<BingoBoardResponse> createBoard(@RequestBody CreateBoardRequest req) {
        List<BingoService.MissionInput> missions = req.missions().stream()
                .map(m -> new BingoService.MissionInput(m.position(), m.title(), m.description()))
                .toList();
        BingoBoardResponse response = bingoService.createBoard(
                req.title(), req.startDate(), req.endDate(), missions);
        return ResponseEntity.ok(response);
    }

    record CreateBoardRequest(
            String title,
            LocalDate startDate,
            LocalDate endDate,
            List<MissionRequest> missions
    ) {}

    record MissionRequest(int position, String title, String description) {}

    /** 대기중 인증 요청 목록 */
    @GetMapping("/pending")
    public ResponseEntity<List<BingoBoardResponse.SubmissionDTO>> getPending() {
        return ResponseEntity.ok(bingoService.getPendingSubmissions());
    }

    /** 승인 */
    @PatchMapping("/{id}/approve")
    public ResponseEntity<String> approve(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        bingoService.approve(id, userDetails.getMember());
        return ResponseEntity.ok("빙고 미션이 승인되었습니다.");
    }

    /** 반려 */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<String> reject(
            @PathVariable Integer id,
            @RequestParam String reason,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        bingoService.reject(id, reason, userDetails.getMember());
        return ResponseEntity.ok("빙고 미션이 반려되었습니다.");
    }
}
