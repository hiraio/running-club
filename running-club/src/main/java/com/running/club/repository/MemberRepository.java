package com.running.club.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.Member;

import java.util.List;

public interface MemberRepository extends JpaRepository<Member, Integer> {

    /** 조별 멤버 수 집계. Object[0]=groupId(Integer), Object[1]=count(Long) */
    @Query("SELECT m.runningGroup.id, COUNT(m) FROM Member m WHERE m.runningGroup IS NOT NULL GROUP BY m.runningGroup.id")
    List<Object[]> countMembersPerGroup();

    @Query("SELECT m FROM Member m WHERE m.loginId = :loginId")
    Optional<Member> findByLoginId(@Param("loginId") String loginId);

    @Query("SELECT m FROM Member m LEFT JOIN FETCH m.runningGroup LEFT JOIN FETCH m.team WHERE m.name = :name AND m.phone = :phone")
    Optional<Member> findByNameAndPhone(@Param("name") String name, @Param("phone") String phone);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Member m WHERE m.loginId = :loginId")
    boolean existsByLoginId(@Param("loginId") String loginId);

    @Query("SELECT m FROM Member m LEFT JOIN FETCH m.runningGroup LEFT JOIN FETCH m.team WHERE m.id = :id")
    Optional<Member> findByIdWithGroup(@Param("id") Integer id);

    @Query("SELECT m FROM Member m LEFT JOIN FETCH m.runningGroup LEFT JOIN FETCH m.team WHERE m.runningGroup.id = :groupId")
    List<Member> findByGroupId(@Param("groupId") Integer groupId);

    @Query("SELECT m FROM Member m LEFT JOIN FETCH m.team LEFT JOIN FETCH m.runningGroup ORDER BY m.name ASC")
    List<Member> findAllWithTeamAndGroup();
}
