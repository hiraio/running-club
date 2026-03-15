package com.running.club.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.AdminHistoryDTO;
import com.running.club.domain.Member;
import com.running.club.domain.RunningRecordDTO;
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
        log.info("[ADMIN-RECORD-SVC] 처리 완료 기록 히스토리 조회");
        List<AdminHistoryDTO> result = runningRecordRepository.findHistory()
                .stream()
                .map(AdminHistoryDTO::from)
                .collect(Collectors.toList());
        log.info("[ADMIN-RECORD-SVC] 히스토리 조회 완료 - 건수={}", result.size());
        return result;
    }

    // 승인 대기 목록 조회
    @Transactional(readOnly = true)
    public List<RunningRecordDTO> getWaitingRecords() {
        log.info("[ADMIN-RECORD-SVC] 승인 대기 목록 조회");
        List<RunningRecordDTO> result = runningRecordRepository.findWaiting()
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
        log.info("[ADMIN-RECORD-SVC] 승인 대기 목록 조회 완료 - 건수={}", result.size());
        return result;
    }

    @Transactional
    public void approve(Integer recordId, Member admin) {
        log.info("[ADMIN-RECORD-SVC] 기록 승인 처리 - recordId={}, adminId={}", recordId, admin.getId());
        int updated = runningRecordRepository.approve(recordId, admin, LocalDate.now());
        if (updated == 0) {
            log.warn("[ADMIN-RECORD-SVC] 승인 실패 - recordId={} (없거나 이미 처리됨)", recordId);
            throw new IllegalStateException("승인 실패: 존재하지 않거나 이미 처리된 기록입니다. (id=" + recordId + ")");
        }
        log.info("[ADMIN-RECORD-SVC] 기록 승인 완료 - recordId={}", recordId);
    }

    @Transactional
    public void reject(Integer recordId, String reason, Member admin) {
        log.info("[ADMIN-RECORD-SVC] 기록 반려 처리 - recordId={}, adminId={}, reason={}", recordId, admin.getId(), reason);
        int updated = runningRecordRepository.reject(recordId, reason, admin);
        if (updated == 0) {
            log.warn("[ADMIN-RECORD-SVC] 반려 실패 - recordId={} (없거나 이미 처리됨)", recordId);
            throw new IllegalStateException("거절 실패: 존재하지 않거나 이미 처리된 기록입니다. (id=" + recordId + ")");
        }
        log.info("[ADMIN-RECORD-SVC] 기록 반려 완료 - recordId={}", recordId);
    }
}
