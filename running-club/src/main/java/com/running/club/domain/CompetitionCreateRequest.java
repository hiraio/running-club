package com.running.club.domain;

import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CompetitionCreateRequest {

    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
}
