package com.running.club.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "competitions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "competition")
    @Builder.Default
    private List<Team> teams = new ArrayList<>();

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    // ── 도메인 업데이트 메서드 ──────────────────────────────────────────────────
    /**
     * PATCH 부분 업데이트 — null이면 기존 값 유지 (Team.update()와 동일한 패턴).
     * isActive=null이면 현재 상태 그대로 (명시적 토글만 반영).
     */
    public void update(String title, LocalDate startDate, LocalDate endDate, Boolean isActive) {
        if (title != null && !title.isBlank()) this.title = title;
        if (startDate != null) this.startDate = startDate;
        if (endDate != null) this.endDate = endDate;
        if (isActive != null) this.isActive = isActive;
    }
}
