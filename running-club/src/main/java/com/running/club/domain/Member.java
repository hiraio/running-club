package com.running.club.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
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

    /** 관리자 팀/조 배정. null 전달 시 해제 */
    public void assignTeamAndGroup(Team team, RunningGroup group) {
        this.team = team;
        this.runningGroup = group;
    }

    /** first_login_candidates 통과 후 실제 멤버 생성 */
    public static Member createFromCandidate(String name, String phone) {
        return Member.builder()
                .name(name)
                .phone(phone)
                .build();
    }
}
