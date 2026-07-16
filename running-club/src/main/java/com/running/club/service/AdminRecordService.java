package com.running.club.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.dto.record.AdminHistoryDTO;
import com.running.club.domain.Member;
import com.running.club.dto.record.RunningRecordDTO;
import com.running.club.repository.RunningRecordRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminRecordService {

    private final RunningRecordRepository runningRecordRepository;

    /**
     * 처리 완료 기록 히스토리 조회 (APPROVED + REJECTED).
     * findHistory()에서 approvedBy JOIN FETCH → LazyInitializationException 없음.
     */
    @Transactional(readOnly = true)
    public List<AdminHistoryDTO> getHistory() {
        return runningRecordRepository.findHistory()
                .stream()
                .map(AdminHistoryDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RunningRecordDTO> getWaitingRecords() {
        return runningRecordRepository.findWaiting()
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approve(Integer recordId, Member admin) {
        int updated = runningRecordRepository.approve(recordId, admin, LocalDateTime.now());
        if (updated == 0) {
            log.warn("[RECORD] 승인 실패 - recordId={} (없거나 이미 처리됨)", recordId);
            throw new IllegalStateException("승인 실패: 존재하지 않거나 이미 처리된 기록입니다. (id=" + recordId + ")");
        }
        log.info("[RECORD] 승인 - recordId={}, adminId={}", recordId, admin.getId());
    }

    @Transactional
    public void reject(Integer recordId, String reason, Member admin) {
        int updated = runningRecordRepository.reject(recordId, reason, admin);
        if (updated == 0) {
            log.warn("[RECORD] 반려 실패 - recordId={} (없거나 이미 처리됨)", recordId);
            throw new IllegalStateException("거절 실패: 존재하지 않거나 이미 처리된 기록입니다. (id=" + recordId + ")");
        }
        log.info("[RECORD] 반려 - recordId={}, adminId={}, reason={}", recordId, admin.getId(), reason);
    }
}
