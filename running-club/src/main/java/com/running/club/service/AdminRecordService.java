package com.running.club.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.Member;
import com.running.club.domain.RunningRecordDTO;
import com.running.club.repository.RunningRecordRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminRecordService {

    private final RunningRecordRepository runningRecordRepository;

    // 승인 대기 목록 조회
    @Transactional(readOnly = true)
    public List<RunningRecordDTO> getWaitingRecords() {
        return runningRecordRepository.findWaiting()
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approve(Integer recordId, Member admin) {
        int updated = runningRecordRepository.approve(recordId, admin, LocalDate.now());
        if (updated == 0) {
            throw new IllegalStateException("승인 실패: 존재하지 않거나 이미 처리된 기록입니다. (id=" + recordId + ")");
        }
    }

    @Transactional
    public void reject(Integer recordId, String reason, Member admin) {
        int updated = runningRecordRepository.reject(recordId, reason, admin);
        if (updated == 0) {
            throw new IllegalStateException("거절 실패: 존재하지 않거나 이미 처리된 기록입니다. (id=" + recordId + ")");
        }
    }
}
