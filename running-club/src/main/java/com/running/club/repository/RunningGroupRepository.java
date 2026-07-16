package com.running.club.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.dto.auth.GroupForJoinDTO;
import com.running.club.domain.RunningGroup;

public interface RunningGroupRepository extends JpaRepository<RunningGroup, Integer> {

    /**
     * 팀 내 그룹 목록 조회.
     * JOIN FETCH team → RunningGroupResponse.from()에서 group.getTeam() 호출 시 추가 쿼리 없음.
     */
    @Query("SELECT g FROM RunningGroup g JOIN FETCH g.team WHERE g.team.id = :teamId ORDER BY g.id ASC")
    List<RunningGroup> findAllByTeamId(@Param("teamId") Integer teamId);

    /** 단건 조회 (JOIN FETCH team 포함 — Response 변환 시 Lazy 로딩 방지) */
    @Query("SELECT g FROM RunningGroup g JOIN FETCH g.team WHERE g.id = :id")
    Optional<RunningGroup> findByGroupId(@Param("id") Integer id);

    /**
     * 회원가입 화면용 조 목록 (경량 DTO).
     * 팀 JOIN FETCH 불필요 — GroupForJoinDTO는 teamId/teamName 미포함.
     */
    @Query("SELECT new com.running.club.dto.auth.GroupForJoinDTO(g.id, g.groupName) " +
           "FROM RunningGroup g " +
           "WHERE g.team.id = :teamId " +
           "ORDER BY g.id ASC")
    List<GroupForJoinDTO> findGroupsForJoin(@Param("teamId") Integer teamId);

    /**
     * 대회 ID로 소속 전체 조 목록 조회 (팀 정보 포함).
     * 회원가입 시 대회 선택 → 조 선택 단계에서 사용.
     */
    @Query("SELECT new com.running.club.dto.auth.GroupForJoinDTO(g.id, g.groupName, g.team.id, g.team.teamName) " +
           "FROM RunningGroup g JOIN g.team t JOIN t.competition c " +
           "WHERE c.id = :competitionId " +
           "ORDER BY t.id ASC, g.id ASC")
    List<GroupForJoinDTO> findGroupsByCompetitionId(@Param("competitionId") Integer competitionId);

    /**
     * 그룹 삭제 전 소속 멤버 수 확인.
     * Member.runningGroup FK 기준 카운트.
     */
    @Query("SELECT COUNT(m) FROM Member m WHERE m.runningGroup.id = :groupId")
    long countMembersByGroupId(@Param("groupId") Integer groupId);
}
