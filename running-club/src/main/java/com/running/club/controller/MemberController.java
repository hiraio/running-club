package com.running.club.controller;

import com.running.club.dto.common.ApiResponse;
import com.running.club.security.CustomUserDetails;
import com.running.club.dto.member.GroupMemberDTO;
import com.running.club.dto.auth.JoinRequest;
import com.running.club.dto.auth.JoinResponse;
import com.running.club.domain.Member;
import com.running.club.dto.member.MemberDashboardResponse;
import com.running.club.domain.MemberProfile;
import com.running.club.dto.member.MemberProfileRequest;
import com.running.club.dto.member.MemberProfileResponse;
import com.running.club.dto.member.MemberPublicProfileResponse;
import com.running.club.dto.auth.MeResponse;
import com.running.club.repository.MemberProfileRepository;
import com.running.club.repository.MemberRepository;
import com.running.club.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final MemberRepository memberRepository;
    private final MemberProfileRepository memberProfileRepository;

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<JoinResponse>> join(@RequestBody JoinRequest request) {
        JoinResponse response = memberService.join(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/api/me")
    public ResponseEntity<MeResponse> getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(memberService.getMe(userDetails.getMember().getId()));
    }

    @GetMapping("/api/me/dashboard")
    public ResponseEntity<MemberDashboardResponse> getDashboard(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(memberService.getDashboard(userDetails.getMember().getId()));
    }

    /**
     * 현재 사용자의 상세 프로필 조회.
     * 프로필 미작성 시 memberId만 담긴 빈 응답 반환 (404 아님 — 아직 입력 전 상태).
     */
    @GetMapping("/api/me/profile")
    public ResponseEntity<MemberProfileResponse> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer memberId = userDetails.getMember().getId();
        MemberProfileResponse response = memberProfileRepository.findByMemberId(memberId)
                .map(MemberProfileResponse::from)
                .orElse(MemberProfileResponse.empty(memberId));
        return ResponseEntity.ok(response);
    }

    /**
     * 현재 사용자의 프로필 생성/수정 (upsert).
     * 프로필이 없으면 새로 생성, 있으면 부분 업데이트.
     * null 필드는 기존 값 유지.
     */
    @Transactional
    @PutMapping("/api/me/profile")
    public ResponseEntity<MemberProfileResponse> updateProfile(
            @RequestBody MemberProfileRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer memberId = userDetails.getMember().getId();
        MemberProfile profile = memberProfileRepository.findByMemberId(memberId)
                .orElseGet(() -> {
                    Member member = memberRepository.findByIdWithGroup(memberId)
                            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
                    return MemberProfile.builder().member(member).build();
                });
        profile.update(request.getSchool(), request.getMajor(), request.getBio(),
                request.getTargetDistance(), request.getProfileImageUrl());
        memberProfileRepository.save(profile);
        return ResponseEntity.ok(MemberProfileResponse.from(profile));
    }

    /** GET /api/members/{id}/profile — 다른 회원의 공개 프로필 조회 (로그인 필요) */
    @GetMapping("/api/members/{id}/profile")
    public ResponseEntity<ApiResponse<MemberPublicProfileResponse>> getMemberProfile(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(memberService.getPublicProfile(id)));
    }

    /** GET /api/groups/{id}/members — 조 전체 멤버 목록 + 통계 (로그인 필요) */
    @GetMapping("/api/groups/{id}/members")
    public ResponseEntity<ApiResponse<java.util.List<GroupMemberDTO>>> getGroupMembers(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(memberService.getGroupMembers(id)));
    }

    @GetMapping("/login")
    public String loginPage() {
        return "로그인 페이지입니다. POST로 아이디와 비번을 보내주세요.";
    }

    @PostMapping("/login")
    @ResponseBody
    public String loginTest() {
        return "시큐리티 필터가 이 요청을 가로채지 못하고 컨트롤러까지 도달했습니다!";
    }
}
