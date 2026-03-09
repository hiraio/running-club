package com.running.club.service;

import com.running.club.domain.Member;
import com.running.club.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Long join(Member member) {
        // 1. 아이디 중복 검증 (이메일 대신 loginId로!)
        validateDuplicateMember(member);
        
        // 2. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(member.getPassword());
        
        // 3. 엔티티 빌더 수정 (loginId를 확실히 넣어줍니다)
        Member securedMember = Member.builder()
                .loginId(member.getLoginId()) // 이제 loginId가 핵심!
                .password(encodedPassword)
                .name(member.getName())
                .email(member.getEmail())    // 이메일은 나중에 받아도 되니 일단 넣기만 함
                .role("ROLE_USER")
                .build();

        memberRepository.save(securedMember);
        return securedMember.getId();
    }

    private void validateDuplicateMember(Member member) {
        // 아이디(loginId)로 중복 체크를 진행합니다.
        memberRepository.findByLoginId(member.getLoginId())
                .ifPresent(m -> {
                    throw new IllegalStateException("이미 존재하는 아이디입니다.");
                });
    }
}