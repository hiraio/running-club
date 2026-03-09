package com.running.club.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.running.club.domain.Member;

public interface MemberRepository extends JpaRepository<Member, Long> {
    // 이제 아이디로 회원을 찾습니다.
    Optional<Member> findByLoginId(String loginId);
}