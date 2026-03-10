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
import com.running.club.domain.RunningRecord;
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
        // 서비스가 이미 DTO 리스트를 반환함
        return ResponseEntity.ok(runningRecordService.getMyRecords(userDetails.getMember()));
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<RunningRecordDTO>> getTeamRecords(@PathVariable Integer teamId) {
        // 서비스가 이미 DTO 리스트를 반환함
        return ResponseEntity.ok(runningRecordService.getRecordsByTeamId(teamId));
    }
    
}