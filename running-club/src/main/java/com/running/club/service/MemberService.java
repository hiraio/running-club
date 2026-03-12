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
    public Integer join(Member member) {
        // 1. 아이디 중복 검증
        validateDuplicateMember(member);

        // 2. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(member.getPassword());

        // 3. 회원 저장
        Member securedMember = Member.builder()
                .loginId(member.getLoginId())
                .password(encodedPassword)
                .name(member.getName())
                .role("USER")
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