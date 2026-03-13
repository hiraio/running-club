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

    @Column(name = "login_id", unique = true)
    private String loginId;

    // 최초 로그인(이름+전화) 사용자는 아직 설정 전이므로 nullable
    @Column(columnDefinition = "text")
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(length = 20)
    private String phone;

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

    /** loginId 또는 password가 없으면 계정 설정 필요 상태 */
    public boolean needsSetup() {
        return loginId == null || password == null;
    }

    /** 최초 로그인 후 계정 설정 완료 시 호출 */
    public void setupAccount(String loginId, String encodedPassword) {
        this.loginId = loginId;
        this.password = encodedPassword;
    }
}
