package com.running.club.controller;

import java.time.LocalDate;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.running.club.domain.CustomUserDetails;
import com.running.club.service.RunningRecordService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/records")
public class RunningRecordController {
    private final RunningRecordService recordService;

    @PostMapping
    public String upload(@AuthenticationPrincipal CustomUserDetails userDetails,
                         @RequestParam Double distance,
                         @RequestParam Integer duration,
                         @RequestParam String runningDate,
                         @RequestParam(required = false) String comment,
                         @RequestParam MultipartFile file) throws Exception {

        recordService.uploadRecord(
                userDetails.getMember(), 
                distance, 
                duration, 
                LocalDate.parse(runningDate), 
                comment, 
                file
        );

        return "기록이 등록되었습니다. 관리자 승인 후 랭킹에 반영됩니다!";
    }
}