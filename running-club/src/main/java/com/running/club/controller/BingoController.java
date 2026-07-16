package com.running.club.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.running.club.dto.common.ApiResponse;
import com.running.club.dto.bingo.BingoBoardResponse;
import com.running.club.security.CustomUserDetails;
import com.running.club.service.BingoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bingo")
@RequiredArgsConstructor
public class BingoController {

    private final BingoService bingoService;

    /** 공개: 빙고판 + 미션 + 전체 조 제출 현황 */
    @GetMapping("/board")
    public ResponseEntity<ApiResponse<BingoBoardResponse>> getBoard() {
        return ResponseEntity.ok(ApiResponse.ok(bingoService.getBoard()));
    }

    /** 인증: 미션 인증 제출 (사진 최대 5장) */
    @PostMapping("/submit")
    public ResponseEntity<String> submit(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Integer missionId,
            @RequestPart("files") List<MultipartFile> files) throws Exception {
        bingoService.submit(userDetails.getMember(), missionId, files);
        return ResponseEntity.ok("빙고 인증이 제출되었습니다.");
    }
}
