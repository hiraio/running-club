package com.running.club.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.Team;
import com.running.club.domain.TeamForJoinDTO;
import com.running.club.domain.TeamSummaryDTO;

public interface TeamRepository extends JpaRepository<Team, Integer> {

    /**
     * 회원가입 화면용 팀 목록 (경량 DTO).
     * 관리자용 findAllByCompetitionIdWithGroupCount와 달리 groupCount 없이 최소 필드만 조회.
     */
    @Query("SELECT new com.running.club.domain.TeamForJoinDTO(t.id, t.teamName, t.colorCode) " +
           "FROM Team t " +
           "WHERE t.competition.id = :competitionId " +
           "ORDER BY t.id ASC")
    List<TeamForJoinDTO> findTeamsForJoin(@Param("competitionId") Integer competitionId);

    /**
     * 대회 내 팀 목록 + 소속 조 수 + 실시간 누적 거리 집계.
     * total_km 컬럼 폐기 → running_records의 APPROVED 기록을 서브쿼리 SUM으로 계산.
     * 서브쿼리로 팀별 누적 거리를 계산 — 항상 실제 데이터와 일치.
     */
    @Query("SELECT new com.running.club.domain.TeamSummaryDTO(" +
           "t.id, t.teamName, t.colorCode, " +
           "COALESCE((SELECT SUM(r2.distance) FROM RunningRecord r2 JOIN r2.member m2 " +
           "          WHERE m2.team = t AND r2.status = 'APPROVED'), 0.0), " +
           "COUNT(DISTINCT g)) " +
           "FROM Team t LEFT JOIN t.groups g " +
           "WHERE t.competition.id = :competitionId " +
           "GROUP BY t.id, t.teamName, t.colorCode " +
           "ORDER BY t.id ASC")
    List<TeamSummaryDTO> findAllByCompetitionIdWithGroupCount(@Param("competitionId") Integer competitionId);

    /** 단건 조회 — 메서드 명명 규칙 대신 JPQL 명시 */
    @Query("SELECT t FROM Team t WHERE t.id = :id")
    Optional<Team> findByTeamId(@Param("id") Integer id);

    /**
     * 회원가입 팀 검증용: Competition을 JOIN FETCH로 함께 로딩.
     * CompetitionStatus 계산(startDate/endDate/isActive)을 위해 competition 필드 접근이 필요하므로
     * JOIN FETCH로 N+1 차단 — 별도 쿼리 없이 한 번에 로딩.
     */
    @Query("SELECT t FROM Team t JOIN FETCH t.competition WHERE t.id = :teamId")
    Optional<Team> findByTeamIdWithCompetition(@Param("teamId") Integer teamId);

    /**
     * 팀 삭제 전 소속 멤버 수 확인 (참조 무결성 체크).
     * Member 엔티티의 team FK를 직접 카운트.
     */
    @Query("SELECT COUNT(m) FROM Member m WHERE m.team.id = :teamId")
    long countMembersByTeamId(@Param("teamId") Integer teamId);
}
