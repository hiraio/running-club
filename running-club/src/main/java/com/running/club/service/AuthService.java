package com.running.club.service;

import com.running.club.domain.CustomUserDetails;
import com.running.club.domain.Member;
import com.running.club.domain.MeResponse;
import com.running.club.repository.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    /**
     * 최초 로그인 (이름 + 전화번호).
     * DB에 미리 등록된 사용자 확인 후 세션 수립.
     * needsSetup=true이면 프론트에서 /setup-account로 리다이렉트.
     */
    @Transactional
    public MeResponse firstLogin(String name, String phone,
                                 HttpServletRequest request, HttpServletResponse response) {
        log.info("[AUTH] 최초 로그인 시도 - name={}", name);

        Member member = memberRepository.findByNameAndPhone(name, phone)
                .orElseThrow(() -> {
                    log.warn("[AUTH] 최초 로그인 실패 - 이름/전화번호 불일치 name={}", name);
                    return new IllegalArgumentException("이름 또는 전화번호가 올바르지 않습니다.");
                });

        // 세션에 SecurityContext 저장
        CustomUserDetails userDetails = new CustomUserDetails(member);
        Authentication auth = UsernamePasswordAuthenticationToken.authenticated(
                userDetails, null, userDetails.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        new HttpSessionSecurityContextRepository().saveContext(context, request, response);

        log.info("[AUTH] 최초 로그인 성공 - memberId={}, needsSetup={}", member.getId(), member.needsSetup());
        return buildMeResponse(member);
    }

    /**
     * JSON 로그인 (loginId + password).
     * Spring Security AuthenticationManager를 통해 인증 후 세션 수립.
     */
    @Transactional
    public MeResponse login(String loginId, String password,
                            HttpServletRequest request, HttpServletResponse response) {
        log.info("[AUTH] 일반 로그인 시도 - loginId={}", loginId);

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginId, password));

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        new HttpSessionSecurityContextRepository().saveContext(context, request, response);

        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        Member member = memberRepository.findByIdWithGroup(userDetails.getMember().getId())
                .orElse(userDetails.getMember());

        log.info("[AUTH] 일반 로그인 성공 - loginId={}, role={}", loginId, member.getRole());
        return buildMeResponse(member);
    }

    /**
     * 계정 설정 (최초 로그인 후 loginId + password 등록).
     * 인증된 사용자만 호출 가능.
     */
    @Transactional
    public MeResponse setupAccount(String loginId, String password, Integer memberId) {
        log.info("[AUTH] 계정 설정 시도 - memberId={}, loginId={}", memberId, loginId);

        if (memberRepository.existsByLoginId(loginId)) {
            log.warn("[AUTH] 계정 설정 실패 - loginId 중복 = {}", loginId);
            throw new IllegalStateException("이미 사용 중인 아이디입니다.");
        }

        Member member = memberRepository.findByIdWithGroup(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        member.setupAccount(loginId, passwordEncoder.encode(password));

        log.info("[AUTH] 계정 설정 완료 - memberId={}, loginId={}", memberId, loginId);
        return buildMeResponse(member);
    }

    private MeResponse buildMeResponse(Member member) {
        return MeResponse.builder()
                .id(member.getId())
                .loginId(member.getLoginId())
                .name(member.getName())
                .role(member.getRole())
                .needsSetup(member.needsSetup())
                .groupId(member.getRunningGroup() != null ? member.getRunningGroup().getId() : null)
                .groupName(member.getRunningGroup() != null ? member.getRunningGroup().getGroupName() : null)
                .build();
    }
}
