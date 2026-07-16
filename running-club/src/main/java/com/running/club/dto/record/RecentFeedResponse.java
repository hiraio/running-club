package com.running.club.dto.record;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * GET /api/records/recent 응답 DTO.
 * - records    : 최신 승인 기록 최대 10건 (피드 타임라인)
 * - dailyKing  : 오늘 가장 먼 거리를 뛴 1인
 * - risingStar : 지난주 대비 이번주 거리 성장률 1위
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentFeedResponse {

    private List<FeedItem> records;
    private FeedHighlight  dailyKing;
    private FeedHighlight  risingStar;

    /** 피드 타임라인 개별 항목 */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedItem {
        private Integer       id;
        private String        userName;
        private String        teamName;
        private String        teamColorCode;
        private String        groupName;
        private Double        distance;
        private Integer       duration;
        private String        runningDate;   // "YYYY-MM-DD"
        private LocalDateTime createdAt;
    }

    /**
     * 하이라이트 항목 (Daily King / Rising Star 공용).
     * value: DailyKing → 오늘 km, RisingStar → 성장률 %
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedHighlight {
        private String userName;
        private String teamName;
        private String teamColorCode;
        private Double value;
    }
}
