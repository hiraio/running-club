package com.running.club.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "running_records",
    indexes = {
        // 개인 대시보드/내 기록: member_id 등가 + status 등가 (docs/refactoring/04-db-indexes.md)
        @Index(name = "idx_records_member_status", columnList = "member_id, status"),
        // 대회별 랭킹/배틀: competition_id 등가 → status 등가 → running_date 범위 (등가→등가→범위 순서)
        @Index(name = "idx_records_comp_status_date", columnList = "competition_id, status, running_date"),
        // 승인 대기 목록(WAITING 소수 행) + 데일리킹/주간 집계(status 등가 + 날짜)
        @Index(name = "idx_records_status_date", columnList = "status, running_date"),
        // 홈 피드: APPROVED 최신 10건 — ORDER BY verified_at DESC LIMIT N을 정렬 없이 처리
        @Index(name = "idx_records_status_verified", columnList = "status, verified_at"),
        // 업로드마다 실행되는 중복 사진 검사 (등가 조회)
        @Index(name = "idx_records_photo_hash", columnList = "photo_hash")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RunningRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id")
    private Competition competition;

    @Column(nullable = false)
    private Double distance;

    private Integer duration;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "photo_hash")
    private String photoHash;

    private String comment;

    @Builder.Default
    private String status = "WAITING";

    // 승인한 관리자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Member approvedBy;

    @Column(name = "rejected_reason")
    private String rejectedReason;

    @Column(name = "admin_comment")
    private String adminComment;

    @Column(name = "running_date", nullable = false)
    private LocalDate runningDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}
