package com.running.club.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "running_records")
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
    private LocalDate verifiedAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}
