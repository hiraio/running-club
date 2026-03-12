package com.running.club.domain;

import java.time.LocalDate;

public enum CompetitionStatus {
    READY,       // 시작 전
    PROCEEDING,  // 진행 중
    FINISHED;    // 종료

    /**
     * startDate, endDate, isActive 기반으로 현재 상태를 계산.
     * isActive=false이면 강제 FINISHED 처리.
     */
    public static CompetitionStatus of(LocalDate startDate, LocalDate endDate, Boolean isActive) {
        if (Boolean.FALSE.equals(isActive)) return FINISHED;
        LocalDate today = LocalDate.now();
        if (today.isBefore(startDate)) return READY;
        if (today.isAfter(endDate))    return FINISHED;
        return PROCEEDING;
    }
}
