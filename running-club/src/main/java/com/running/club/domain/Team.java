package com.running.club.domain;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "teams")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id")
    private Competition competition;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(name = "color_code")
    private String colorCode;

    @OneToMany(mappedBy = "team")
    @Builder.Default
    private List<Member> members = new ArrayList<>();

    // RunningGroup은 Team에 종속적이므로 ALL Cascade — Team 삭제 시 소속 그룹 자동 삭제
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RunningGroup> groups = new ArrayList<>();

    // ── 도메인 업데이트 메서드 ──────────────────────────────────────────────────
    /**
     * null이면 기존 값 유지 (PATCH 부분 업데이트 의미론).
     * colorCode는 null 전달 시 값을 보존 (명시적 제거 필요 시 별도 메서드 추가 가능).
     */
    public void update(String teamName, String colorCode) {
        if (teamName != null && !teamName.isBlank()) this.teamName = teamName;
        if (colorCode != null) this.colorCode = colorCode;
    }
}
