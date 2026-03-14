package com.running.club.repository;

import com.running.club.domain.MemberProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MemberProfileRepository extends JpaRepository<MemberProfile, Integer> {

    @Query("SELECT p FROM MemberProfile p WHERE p.member.id = :memberId")
    Optional<MemberProfile> findByMemberId(@Param("memberId") Integer memberId);
}
