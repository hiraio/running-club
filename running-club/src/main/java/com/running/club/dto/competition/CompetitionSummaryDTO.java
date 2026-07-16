package com.running.club.dto.competition;

import com.running.club.domain.CompetitionStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Getter;

@Getter
public class CompetitionSummaryDTO {

    private final Integer id;
    private final String title;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final CompetitionStatus status;
    private final long teamCount;
    private final LocalDateTime createdAt;

    /**
     * JPQL DTO Projection 전용 생성자.
     * 상태(status)는 날짜 + isActive 기반으로 즉시 계산하여 저장.
     */
    public CompetitionSummaryDTO(Integer id, String title, LocalDate startDate, LocalDate endDate,
                                 Boolean isActive, LocalDateTime createdAt, Long teamCount) {
        this.id = id;
        this.title = title;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = CompetitionStatus.of(startDate, endDate, isActive);
        this.teamCount = teamCount;
        this.createdAt = createdAt;
    }
}
