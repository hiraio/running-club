package com.running.club.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * 회원 상세 프로필 (1:1 Member).
 *
 * <p>members 테이블은 인증/식별 정보만 유지하고,
 * 학교·전공·자기소개 등 UX 관련 상세 정보는 이 테이블로 분리.
 * 최초 로그인 온보딩(setup-account) Step 2에서 입력.
 * 모든 필드 선택 사항 — 아직 입력 안 한 사용자도 허용.
 */
@Entity
@Table(name = "member_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MemberProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** 1:1 Member — member_id UNIQUE FK */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", unique = true, nullable = false)
    private Member member;

    @Column(length = 100)
    private String school;

    @Column(length = 100)
    private String major;

    /** 자기소개 — 길이 제한 없음 */
    @Column(columnDefinition = "text")
    private String bio;

    /** 목표 거리 (km 단위) */
    @Column(name = "target_distance")
    private Double targetDistance;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    /**
     * 프로필 부분 업데이트 (null 전달 시 기존 값 유지).
     * 엔티티 불변성 유지 — setter 대신 도메인 메서드.
     */
    public void update(String school, String major, String bio,
                       Double targetDistance, String profileImageUrl) {
        if (school != null) this.school = school;
        if (major != null) this.major = major;
        if (bio != null) this.bio = bio;
        if (targetDistance != null) this.targetDistance = targetDistance;
        if (profileImageUrl != null) this.profileImageUrl = profileImageUrl;
    }
}
