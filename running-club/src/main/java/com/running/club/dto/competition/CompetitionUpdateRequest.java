package com.running.club.dto.competition;

import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CompetitionUpdateRequest {

    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    // null이면 기존 값 유지
    private Boolean isActive;
}
