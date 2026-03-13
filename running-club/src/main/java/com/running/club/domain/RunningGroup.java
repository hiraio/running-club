package com.running.club.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "running_groups")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RunningGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "group_name", nullable = false)
    private String groupName;

    // ── 도메인 업데이트 메서드 ──────────────────────────────────────────────────
    public void update(String groupName) {
        if (groupName != null && !groupName.isBlank()) this.groupName = groupName;
    }
}
