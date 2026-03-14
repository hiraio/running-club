package com.running.club.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 오늘의 MVP DTO — 특정 대회에서 당일 APPROVED 기록 누적 거리가 가장 높은 멤버.
 * JPQL Constructor Expression 전용 — 필드 순서·타입이 쿼리와 정확히 일치해야 함.
 */
@Getter
@AllArgsConstructor
public class TodayMvpDTO {
    private Integer memberId;
    private String  name;
    private String  teamName;
    private String  teamColorCode;
    private String  groupName;
    private Double  todayKm;
}
