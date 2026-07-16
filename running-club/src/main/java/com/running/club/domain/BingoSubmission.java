package com.running.club.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bingo_submissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"mission_id", "group_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BingoSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id", nullable = false)
    private BingoMission mission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private RunningGroup group;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BingoSubmissionStatus status = BingoSubmissionStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by", nullable = false)
    private Member submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private Member verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @ElementCollection
    @CollectionTable(name = "bingo_submission_photos",
                     joinColumns = @JoinColumn(name = "submission_id"))
    @Column(name = "photo_url")
    @Builder.Default
    private List<String> photoUrls = new ArrayList<>();

    @PrePersist
    protected void onCreate() { this.submittedAt = LocalDateTime.now(); }

    /** 관리자 승인 */
    public void approve(Member admin) {
        this.status = BingoSubmissionStatus.APPROVED;
        this.verifiedBy = admin;
        this.verifiedAt = LocalDateTime.now();
        this.rejectReason = null;
    }

    /** 관리자 반려 */
    public void reject(Member admin, String reason) {
        this.status = BingoSubmissionStatus.REJECTED;
        this.verifiedBy = admin;
        this.verifiedAt = LocalDateTime.now();
        this.rejectReason = reason;
    }

    /** 반려 후 재제출 */
    public void resubmit(Member submitter, List<String> newPhotoUrls) {
        this.status = BingoSubmissionStatus.PENDING;
        this.submittedBy = submitter;
        this.submittedAt = LocalDateTime.now();
        this.photoUrls.clear();
        this.photoUrls.addAll(newPhotoUrls);
        this.verifiedBy = null;
        this.verifiedAt = null;
        this.rejectReason = null;
    }
}
