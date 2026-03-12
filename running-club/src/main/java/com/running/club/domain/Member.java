package com.running.club.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "login_id", unique = true, nullable = false)
    private String loginId;

    // oauth 유저는 password가 없을 수 있으므로 nullable
    @Column(columnDefinition = "text")
    private String password;

    @Column(nullable = false)
    private String name;

    @Builder.Default
    private String role = "USER";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    // 팀 내 조 (미배정 시 null)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private RunningGroup runningGroup;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "oauth_id")
    private String oauthId;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}
