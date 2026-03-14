package com.running.club.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.Member;

public interface MemberRepository extends JpaRepository<Member, Integer> {

    @Query("SELECT m FROM Member m WHERE m.loginId = :loginId")
    Optional<Member> findByLoginId(@Param("loginId") String loginId);

    @Query("SELECT m FROM Member m LEFT JOIN FETCH m.runningGroup LEFT JOIN FETCH m.team WHERE m.name = :name AND m.phone = :phone")
    Optional<Member> findByNameAndPhone(@Param("name") String name, @Param("phone") String phone);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Member m WHERE m.loginId = :loginId")
    boolean existsByLoginId(@Param("loginId") String loginId);

    @Query("SELECT m FROM Member m LEFT JOIN FETCH m.runningGroup LEFT JOIN FETCH m.team WHERE m.id = :id")
    Optional<Member> findByIdWithGroup(@Param("id") Integer id);
}
