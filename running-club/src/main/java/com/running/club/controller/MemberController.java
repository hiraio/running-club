package com.running.club.controller;

import com.running.club.domain.*;
import com.running.club.repository.MemberProfileRepository;
import com.running.club.repository.MemberRepository;
import com.running.club.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final MemberRepository memberRepository;
    private final MemberProfileRepository memberProfileRepository;

    /**
     * 회원가입.
     *
     * <p>Request body (JSON):
     * <pre>
     * {
     *   "loginId":  "user01",
     *   "password": "1234",
     *   "name":     "홍길동",
     *   "teamId":   1,        // 필수 — 활성 대회 소속 팀 ID
     *   "groupId":  2         // 선택 — null 또는 생략 가능
     * }
     * </pre>
     *
     * <p>201 Created + ApiResponse&lt;JoinResponse&gt; 반환.
     * 실패(중복 ID, 종료 대회, 팀·조 불일치)는 GlobalExceptionHandler → 400.
     */
    @PostMapping("/join")
    public ResponseEntity<ApiResponse<JoinResponse>> join(@RequestBody JoinRequest request) {
        log.info("[JOIN] 회원가입 요청 수신 - loginId={}, name={}, groupId={}",
                request.getLoginId(), request.getName(), request.getGroupId());
        JoinResponse response = memberService.join(request);
        log.info("[JOIN] 회원가입 완료 - memberId={}, loginId={}", response.getMemberId(), response.getLoginId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * 현재 로그인한 사용자 정보 조회.
     * 인증 안 된 경우 SecurityConfig의 EntryPoint가 401 반환.
     */
    @GetMapping("/api/me")
    public ResponseEntity<MeResponse> getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("[ME] 사용자 정보 요청 - loginId={}", userDetails.getUsername());
        MeResponse response = memberService.getMe(userDetails.getMember().getId());
        log.info("[ME] 사용자 정보 반환 - loginId={}, role={}", response.getLoginId(), response.getRole());
        return ResponseEntity.ok(response);
    }

    /**
     * 개인 대시보드 데이터 (프로필 + 달리기 통계 + 최근기록 통합).
     * 프론트 대시보드 페이지에서 단일 API 호출로 모든 데이터 수신.
     */
    @GetMapping("/api/me/dashboard")
    public ResponseEntity<MemberDashboardResponse> getDashboard(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer memberId = userDetails.getMember().getId();
        log.info("[DASHBOARD] 대시보드 요청 - memberId={}", memberId);
        MemberDashboardResponse response = memberService.getDashboard(memberId);
        return ResponseEntity.ok(response);
    }

    /**
     * 현재 사용자의 상세 프로필 조회.
     * 프로필 미작성 시 memberId만 담긴 빈 응답 반환 (404 아님 — 아직 입력 전 상태).
     */
    @GetMapping("/api/me/profile")
    public ResponseEntity<MemberProfileResponse> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer memberId = userDetails.getMember().getId();
        log.info("[PROFILE] 프로필 조회 - memberId={}", memberId);
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
        log.info("[PROFILE] 프로필 저장 - memberId={}", memberId);

        MemberProfile profile = memberProfileRepository.findByMemberId(memberId)
                .orElseGet(() -> {
                    Member member = memberRepository.findByIdWithGroup(memberId)
                            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
                    return MemberProfile.builder().member(member).build();
                });

        profile.update(request.getSchool(), request.getMajor(), request.getBio(),
                request.getTargetDistance(), request.getProfileImageUrl());
        memberProfileRepository.save(profile);

        log.info("[PROFILE] 프로필 저장 완료 - memberId={}", memberId);
        return ResponseEntity.ok(MemberProfileResponse.from(profile));
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
