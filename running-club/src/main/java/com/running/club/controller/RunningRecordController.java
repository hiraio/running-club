package com.running.club.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.running.club.domain.CustomUserDetails;
import com.running.club.domain.RecentFeedResponse;
import com.running.club.domain.RunningRecordDTO;
import com.running.club.service.RunningRecordService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/records")
public class RunningRecordController {
    private final RunningRecordService runningRecordService;

    @PostMapping
    public String upload(@AuthenticationPrincipal CustomUserDetails userDetails,
                         @RequestParam Double distance,
                         @RequestParam Integer duration,
                         @RequestParam String runningDate,
                         @RequestParam(required = false) String comment,
                         @RequestParam MultipartFile file) throws Exception {
        runningRecordService.uploadRecord(
                userDetails.getMember(),
                distance,
                duration,
                LocalDate.parse(runningDate),
                comment,
                file
        );
        return "기록이 등록되었습니다. 관리자 승인 후 랭킹에 반영됩니다!";
    }

    @GetMapping("/my")
    public ResponseEntity<List<RunningRecordDTO>> getMyRecords(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(runningRecordService.getMyRecords(userDetails.getMember()));
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<RunningRecordDTO>> getTeamRecords(@PathVariable Integer teamId) {
        return ResponseEntity.ok(runningRecordService.getRecordsByTeamId(teamId));
    }

    /**
     * 활동 피드 조회 (인증 불필요 — 홈 화면 공개 노출용).
     * 최신 APPROVED 기록 10건 + Daily King + Rising Star 반환.
     */
    @GetMapping("/recent")
    public ResponseEntity<RecentFeedResponse> getRecentFeed() {
        return ResponseEntity.ok(runningRecordService.getRecentFeed());
    }

    /** 조별 기록 조회 (인증 불필요 — SecurityConfig에서 /api/records/group/** permitAll) */
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<RunningRecordDTO>> getGroupRecords(@PathVariable Integer groupId) {
        return ResponseEntity.ok(runningRecordService.getRecordsByGroupId(groupId));
    }
}
