package com.running.club.dto.auth;

import com.running.club.domain.CompetitionStatus;

import java.time.LocalDate;

import lombok.Getter;

/**
 * 회원가입 화면 - 대회 선택 단계용 DTO.
 *
 * <p>활성 대회만 조회하므로 status는 READY(시작 전) 또는 PROCEEDING(진행 중)만 반환.
 * 조회 시점의 날짜 기준으로 status를 즉시 계산하여 프론트가 별도 계산 없이 사용 가능.
 */
@Getter
public class CompetitionForJoinDTO {

    private final Integer id;
    private final String title;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final CompetitionStatus status; // READY or PROCEEDING (FINISHED는 필터링됨)

    /**
     * JPQL DTO Projection 전용 생성자.
     * isActive 값을 받아 status를 생성 시점에 계산 — 클라이언트 재계산 불필요.
     */
    public CompetitionForJoinDTO(Integer id, String title,
                                 LocalDate startDate, LocalDate endDate,
                                 Boolean isActive) {
        this.id = id;
        this.title = title;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = CompetitionStatus.of(startDate, endDate, isActive);
    }
}
