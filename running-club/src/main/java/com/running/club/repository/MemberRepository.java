package com.running.club.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.Member;

public interface MemberRepository extends JpaRepository<Member, Integer> {

    @Query("SELECT m FROM Member m WHERE m.loginId = :loginId")
    Optional<Member> findByLoginId(@Param("loginId") String loginId);
}
