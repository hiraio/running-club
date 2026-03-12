package com.running.club.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.Member;
import com.running.club.domain.RankingDTO;
import com.running.club.domain.RunningRecord;

public interface RunningRecordRepository extends JpaRepository<RunningRecord, Integer> {

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM RunningRecord r WHERE r.photoHash = :hash")
    boolean existsByPhotoHash(@Param("hash") String hash);

    // 승인 대기 목록 - member/team/group 한 번에 로딩 (N+1 방지)
    @Query("SELECT r FROM RunningRecord r " +
           "JOIN FETCH r.member m " +
           "LEFT JOIN FETCH m.team " +
           "LEFT JOIN FETCH m.runningGroup " +
           "WHERE r.status = 'WAITING' " +
           "ORDER BY r.createdAt ASC")
    List<RunningRecord> findWaiting();

    @Query("SELECT r FROM RunningRecord r WHERE r.member = :member ORDER BY r.createdAt DESC")
    List<RunningRecord> findByMember(@Param("member") Member member);

    @Query("SELECT r FROM RunningRecord r WHERE r.member.team.id = :teamId ORDER BY r.createdAt DESC")
    List<RunningRecord> findByTeamId(@Param("teamId") Integer teamId);

    // ── 랭킹 쿼리 (APPROVED 기록만 집계) ──────────────────────────────────────

    // 팀별 랭킹: 팀 id, 팀명, 누적 거리, 기록 수
    @Query("SELECT new com.running.club.domain.RankingDTO(m.team.id, m.team.teamName, SUM(r.distance), COUNT(r)) " +
           "FROM RunningRecord r JOIN r.member m " +
           "WHERE r.status = 'APPROVED' AND m.team IS NOT NULL " +
           "GROUP BY m.team.id, m.team.teamName " +
           "ORDER BY SUM(r.distance) DESC")
    List<RankingDTO> getTeamRanking();

    // 조별 랭킹: 조 id, 조명, 누적 거리, 기록 수
    @Query("SELECT new com.running.club.domain.RankingDTO(m.runningGroup.id, m.runningGroup.groupName, SUM(r.distance), COUNT(r)) " +
           "FROM RunningRecord r JOIN r.member m " +
           "WHERE r.status = 'APPROVED' AND m.runningGroup IS NOT NULL " +
           "GROUP BY m.runningGroup.id, m.runningGroup.groupName " +
           "ORDER BY SUM(r.distance) DESC")
    List<RankingDTO> getGroupRanking();

    // 개인별 랭킹: 회원 id, 회원명, 누적 거리, 기록 수
    @Query("SELECT new com.running.club.domain.RankingDTO(m.id, m.name, SUM(r.distance), COUNT(r)) " +
           "FROM RunningRecord r JOIN r.member m " +
           "WHERE r.status = 'APPROVED' " +
           "GROUP BY m.id, m.name " +
           "ORDER BY SUM(r.distance) DESC")
    List<RankingDTO> getMemberRanking();

    @Modifying
    @Query("UPDATE RunningRecord r SET r.status = 'APPROVED', r.approvedBy = :admin, r.verifiedAt = :today WHERE r.id = :id AND r.status = 'WAITING'")
    int approve(@Param("id") Integer id, @Param("admin") Member admin, @Param("today") LocalDate today);

    @Modifying
    @Query("UPDATE RunningRecord r SET r.status = 'REJECTED', r.rejectedReason = :reason, r.approvedBy = :admin WHERE r.id = :id AND r.status = 'WAITING'")
    int reject(@Param("id") Integer id, @Param("reason") String reason, @Param("admin") Member admin);
}
