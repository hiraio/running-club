package com.running.club.controller;

import com.running.club.dto.auth.FirstLoginRequest;
import com.running.club.dto.auth.LoginRequest;
import com.running.club.dto.auth.MeResponse;
import com.running.club.dto.auth.SetupAccountRequest;
import com.running.club.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 최초 로그인: 이름 + 전화번호로 인증.
     * 성공 시 세션 수립, needsSetup=true이면 /setup-account로 리다이렉트 필요.
     */
    @PostMapping("/first-login")
    public ResponseEntity<MeResponse> firstLogin(
            @RequestBody FirstLoginRequest request,
            HttpServletRequest httpRequest) {
        log.info("[AUTH-CTL] 최초 로그인 요청 - name={}", request.getName());
        MeResponse me = authService.firstLogin(request.getName(), request.getPhone(), httpRequest);
        return ResponseEntity.ok(me);
    }

    /**
     * 일반 로그인: loginId + password JSON 방식.
     * Spring Security form login을 대체.
     */
    @PostMapping("/login")
    public ResponseEntity<MeResponse> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        log.info("[AUTH-CTL] 일반 로그인 요청 - loginId={}", request.getLoginId());
        MeResponse me = authService.login(request.getLoginId(), request.getPassword(), httpRequest, httpResponse);
        return ResponseEntity.ok(me);
    }

    /**
     * 계정 설정: 최초 로그인 후 loginId + password 등록.
     * 반드시 인증된 상태(세션 보유)에서 호출.
     */
    @PostMapping("/setup-account")
    public ResponseEntity<MeResponse> setupAccount(
            @RequestBody SetupAccountRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        log.info("[AUTH-CTL] 계정 설정 요청 - loginId={}", request.getLoginId());
        MeResponse me = authService.setupAccount(
                request.getLoginId(), request.getPassword(),
                request.getName(), request.getPhone(),
                httpRequest, httpResponse);
        return ResponseEntity.ok(me);
    }
}
