package com.running.club.service;

import com.running.club.security.CustomUserDetails;
import com.running.club.domain.FirstLoginCandidate;
import com.running.club.domain.Member;
import com.running.club.dto.auth.MeResponse;
import com.running.club.repository.FirstLoginCandidateRepository;
import com.running.club.repository.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
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
    private final FirstLoginCandidateRepository candidateRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    /**
     * 최초 로그인 (이름 + 전화번호).
     * DB 쓰기 없음 — candidate 검증 후 세션에 name/phone 저장.
     * 실제 member 생성 + candidate 소진은 setupAccount()에서 원자적으로 처리.
     */
    public MeResponse firstLogin(String name, String phone, HttpServletRequest request) {
        log.info("[AUTH] 최초 로그인 시도 - name={}", name);

        candidateRepository.findUnusedByNameAndPhone(name, phone)
                .orElseThrow(() -> {
                    log.warn("[AUTH] 최초 로그인 실패 - 초대 정보 없음 name={}", name);
                    return new IllegalArgumentException("이름 또는 전화번호가 올바르지 않습니다.");
                });

        // 세션에 저장 (setupAccount에서 읽어서 원자적 처리)
        HttpSession session = request.getSession(true);
        session.setAttribute("firstLogin.name", name);
        session.setAttribute("firstLogin.phone", phone);

        log.info("[AUTH] 최초 로그인 검증 성공 - name={}", name);
        return MeResponse.builder()
                .name(name)
                .role("USER")
                .needsSetup(true)
                .build();
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
     * 세션에서 이름/전화번호를 읽어 candidate 소진 + member 생성을 하나의 트랜잭션으로 처리.
     */
    @Transactional
    public MeResponse setupAccount(String loginId, String password,
                                   String reqName, String reqPhone,
                                   HttpServletRequest request, HttpServletResponse response) {
        log.info("[AUTH] 계정 설정 시도 - loginId={}", loginId);

        // 1순위: 세션에서 name/phone 읽기
        // 2순위: 모바일 크로스도메인 쿠키 차단 시 프론트가 직접 전달한 name/phone
        String name = null;
        String phone = null;

        HttpSession session = request.getSession(false);
        if (session != null) {
            name  = (String) session.getAttribute("firstLogin.name");
            phone = (String) session.getAttribute("firstLogin.phone");
        }

        if (name == null || phone == null) {
            name = reqName;
            phone = reqPhone;
        }

        if (name == null || phone == null) {
            throw new IllegalStateException("세션이 만료되었습니다. 처음 로그인을 다시 시도해주세요.");
        }

        if (memberRepository.existsByLoginId(loginId)) {
            log.warn("[AUTH] 계정 설정 실패 - loginId 중복 = {}", loginId);
            throw new IllegalStateException("이미 사용 중인 아이디입니다.");
        }

        // candidate 소진 + member 생성 + 계정 설정 — 원자적 처리
        FirstLoginCandidate candidate = candidateRepository.findUnusedByNameAndPhone(name, phone)
                .orElseThrow(() -> new IllegalStateException("초대 정보가 유효하지 않습니다. 처음 로그인을 다시 시도해주세요."));

        candidate.markUsed();

        Member member = Member.createFromCandidate(name, phone);
        member.setupAccount(loginId, passwordEncoder.encode(password));
        member = memberRepository.save(member);

        // 세션 정리 후 Spring Security 인증 세션 수립
        session.removeAttribute("firstLogin.name");
        session.removeAttribute("firstLogin.phone");

        CustomUserDetails userDetails = new CustomUserDetails(member);
        Authentication auth = UsernamePasswordAuthenticationToken.authenticated(
                userDetails, null, userDetails.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        new HttpSessionSecurityContextRepository().saveContext(context, request, response);

        log.info("[AUTH] 계정 설정 완료 - memberId={}, loginId={}", member.getId(), loginId);
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
                .teamId(member.getTeam() != null ? member.getTeam().getId() : null)
                .teamName(member.getTeam() != null ? member.getTeam().getTeamName() : null)
                .teamColorCode(member.getTeam() != null ? member.getTeam().getColorCode() : null)
                .build();
    }
}
