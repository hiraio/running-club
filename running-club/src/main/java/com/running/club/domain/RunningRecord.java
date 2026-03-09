package com.running.club.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "running_records")
@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class RunningRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // ERD상 int4

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    private Integer competitionId; // 대회 연관 (일단 null 허용)

    private Double distance; // float8 -> Double
    private Integer duration; // int4 (초 단위 저장 권장)
    
    private String photoUrl; // 이미지 저장 경로
    private String photoHash; // [핵심] 이미지 중복 체크용 SHA-256
    
    private String comment;
    
    @Builder.Default
    private String status = "PENDING"; // 기본값: 승인 대기

    private String rejectedReason;
    private String adminComment;

    private LocalDate runningDate; // 실제 뛴 날짜
    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}