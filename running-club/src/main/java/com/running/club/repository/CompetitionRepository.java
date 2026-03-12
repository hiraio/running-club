package com.running.club.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.Competition;
import com.running.club.domain.CompetitionSummaryDTO;

public interface CompetitionRepository extends JpaRepository<Competition, Integer> {

    // 전체 목록 + 팀 수 집계 - DTO Projection으로 N+1 차단
    @Query("SELECT new com.running.club.domain.CompetitionSummaryDTO(" +
           "c.id, c.title, c.startDate, c.endDate, c.isActive, c.createdAt, COUNT(t)) " +
           "FROM Competition c LEFT JOIN c.teams t " +
           "GROUP BY c.id, c.title, c.startDate, c.endDate, c.isActive, c.createdAt " +
           "ORDER BY c.createdAt DESC")
    List<CompetitionSummaryDTO> findAllWithTeamCount();

    // 단건 조회 (JPQL 명시)
    @Query("SELECT c FROM Competition c WHERE c.id = :id")
    Optional<Competition> findByCompetitionId(@Param("id") Integer id);

    // 삭제 전 소속 팀 수 확인 (참조 무결성 체크)
    @Query("SELECT COUNT(t) FROM Team t WHERE t.competition.id = :id")
    long countTeamsByCompetitionId(@Param("id") Integer id);
}
