package com.running.club.dto.competition;

import com.running.club.domain.Competition;
import com.running.club.domain.CompetitionStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CompetitionResponse {

    private Integer id;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private CompetitionStatus status;
    private LocalDateTime createdAt;

    public static CompetitionResponse from(Competition c) {
        return CompetitionResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .status(CompetitionStatus.of(c.getStartDate(), c.getEndDate(), c.getIsActive()))
                .createdAt(c.getCreatedAt())
                .build();
    }
}
