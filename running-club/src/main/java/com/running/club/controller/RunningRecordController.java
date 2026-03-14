package com.running.club.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

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
import com.running.club.domain.Member;
import com.running.club.domain.RecentFeedResponse;
import com.running.club.domain.RunningRecord;
import com.running.club.domain.RunningRecordDTO;
import com.running.club.service.RunningRecordService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
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

        log.info("[RECORD] 기록 업로드 요청 - user={}, distance={}km, duration={}s, runningDate={}, fileSize={}bytes",
                userDetails.getUsername(), distance, duration, runningDate, file.getSize());
        runningRecordService.uploadRecord(
                userDetails.getMember(),
                distance,
                duration,
                LocalDate.parse(runningDate),
                comment,
                file
        );
        log.info("[RECORD] 기록 업로드 완료 - user={}", userDetails.getUsername());
        return "기록이 등록되었습니다. 관리자 승인 후 랭킹에 반영됩니다!";
    }

    @GetMapping("/my")
    public ResponseEntity<List<RunningRecordDTO>> getMyRecords(@AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("[RECORD] 내 기록 조회 요청 - user={}", userDetails.getUsername());
        List<RunningRecordDTO> result = runningRecordService.getMyRecords(userDetails.getMember());
        log.info("[RECORD] 내 기록 조회 완료 - user={}, 건수={}", userDetails.getUsername(), result.size());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<RunningRecordDTO>> getTeamRecords(@PathVariable Integer teamId) {
        log.info("[RECORD] 팀 기록 조회 요청 - teamId={}", teamId);
        List<RunningRecordDTO> result = runningRecordService.getRecordsByTeamId(teamId);
        log.info("[RECORD] 팀 기록 조회 완료 - teamId={}, 건수={}", teamId, result.size());
        return ResponseEntity.ok(result);
    }

    /**
     * 활동 피드 조회 (인증 불필요 — 홈 화면 공개 노출용).
     * 최신 APPROVED 기록 10건 + Daily King + Rising Star 반환.
     */
    @GetMapping("/recent")
    public ResponseEntity<RecentFeedResponse> getRecentFeed() {
        log.info("[RECORD] 활동 피드 조회 요청");
        RecentFeedResponse result = runningRecordService.getRecentFeed();
        log.info("[RECORD] 활동 피드 조회 완료 - 피드{}건", result.getRecords().size());
        return ResponseEntity.ok(result);
    }

    /** 조별 기록 조회 (인증 불필요 — SecurityConfig에서 /api/records/group/** permitAll) */
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<RunningRecordDTO>> getGroupRecords(@PathVariable Integer groupId) {
        log.info("[RECORD] 조 기록 조회 요청 - groupId={}", groupId);
        List<RunningRecordDTO> result = runningRecordService.getRecordsByGroupId(groupId);
        log.info("[RECORD] 조 기록 조회 완료 - groupId={}, 건수={}", groupId, result.size());
        return ResponseEntity.ok(result);
    }
}