package com.running.club.controller;

import com.running.club.domain.ApiResponse;
import com.running.club.domain.CustomUserDetails;
import com.running.club.domain.JoinRequest;
import com.running.club.domain.JoinResponse;
import com.running.club.domain.MeResponse;
import com.running.club.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

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
        log.info("[JOIN] 회원가입 요청 수신 - loginId={}, name={}, teamId={}, groupId={}",
                request.getLoginId(), request.getName(), request.getTeamId(), request.getGroupId());
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
