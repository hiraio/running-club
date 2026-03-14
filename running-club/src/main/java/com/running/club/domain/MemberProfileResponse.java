package com.running.club.domain;

import lombok.Builder;
import lombok.Getter;

/** GET /api/me/profile 및 PUT /api/me/profile 응답 DTO. */
@Getter
@Builder
public class MemberProfileResponse {

    private Integer memberId;
    private String school;
    private String major;
    private String bio;
    private Double targetDistance;
    private String profileImageUrl;

    public static MemberProfileResponse from(MemberProfile profile) {
        return MemberProfileResponse.builder()
                .memberId(profile.getMember().getId())
                .school(profile.getSchool())
                .major(profile.getMajor())
                .bio(profile.getBio())
                .targetDistance(profile.getTargetDistance())
                .profileImageUrl(profile.getProfileImageUrl())
                .build();
    }

    /** 프로필이 아직 없는 사용자용 빈 응답 */
    public static MemberProfileResponse empty(Integer memberId) {
        return MemberProfileResponse.builder().memberId(memberId).build();
    }
}
