package com.running.club.repository;

import com.running.club.domain.FirstLoginCandidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FirstLoginCandidateRepository extends JpaRepository<FirstLoginCandidate, Long> {

    @Query("SELECT c FROM FirstLoginCandidate c WHERE c.name = :name AND c.phone = :phone AND c.isUsed = false")
    Optional<FirstLoginCandidate> findUnusedByNameAndPhone(@Param("name") String name, @Param("phone") String phone);
}
