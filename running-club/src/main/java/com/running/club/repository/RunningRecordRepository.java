package com.running.club.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.GroupContributionDTO;
import com.running.club.domain.Member;
import com.running.club.domain.RankingDTO;
import com.running.club.domain.RunningRecord;
import com.running.club.domain.TodayMvpDTO;

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

    /**
     * 처리 완료 기록 히스토리 (APPROVED + REJECTED).
     * approvedBy LEFT JOIN FETCH: AdminHistoryDTO.from()에서 approvedBy.getName() 접근 시 N+1 차단.
     * createdAt DESC — 최신 처리 순 정렬.
     */
    @Query("SELECT r FROM RunningRecord r " +
           "JOIN FETCH r.member m " +
           "LEFT JOIN FETCH m.team " +
           "LEFT JOIN FETCH m.runningGroup " +
           "LEFT JOIN FETCH r.approvedBy " +
           "WHERE r.status IN ('APPROVED', 'REJECTED') " +
           "ORDER BY r.createdAt DESC")
    List<RunningRecord> findHistory();

    /**
     * 내 기록 조회.
     * JOIN FETCH member.team/runningGroup: RunningRecordDTO.from() 내 Lazy 접근 시 N+1 차단.
     */
    @Query("SELECT r FROM RunningRecord r " +
           "JOIN FETCH r.member m " +
           "LEFT JOIN FETCH m.team " +
           "LEFT JOIN FETCH m.runningGroup " +
           "WHERE r.member = :member " +
           "ORDER BY r.createdAt DESC")
    List<RunningRecord> findByMember(@Param("member") Member member);

    /**
     * 팀별 기록 조회.
     * JOIN FETCH: RunningRecordDTO.from()에서 team/runningGroup 접근 시 추가 쿼리 없음.
     */
    @Query("SELECT r FROM RunningRecord r " +
           "JOIN FETCH r.member m " +
           "LEFT JOIN FETCH m.team " +
           "LEFT JOIN FETCH m.runningGroup " +
           "WHERE m.team.id = :teamId " +
           "ORDER BY r.createdAt DESC")
    List<RunningRecord> findByTeamId(@Param("teamId") Integer teamId);

    /**
     * 조별 기록 조회.
     * member → team/runningGroup LEFT JOIN FETCH: RunningRecordDTO.from()에서
     * member.getTeam()/getRunningGroup() 호출 시 추가 쿼리 없음 (N+1 차단).
     */
    @Query("SELECT r FROM RunningRecord r " +
           "JOIN FETCH r.member m " +
           "LEFT JOIN FETCH m.team " +
           "LEFT JOIN FETCH m.runningGroup " +
           "WHERE m.runningGroup.id = :groupId " +
           "ORDER BY r.createdAt DESC")
    List<RunningRecord> findByGroupId(@Param("groupId") Integer groupId);

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

    // ── 대회별 랭킹 쿼리 (APPROVED + 특정 competition_id 필터) ───────────────

    /** 팀별 랭킹 — 특정 대회 기준 */
    @Query("SELECT new com.running.club.domain.RankingDTO(m.team.id, m.team.teamName, SUM(r.distance), COUNT(r)) " +
           "FROM RunningRecord r JOIN r.member m " +
           "WHERE r.status = 'APPROVED' AND m.team IS NOT NULL AND r.competition.id = :competitionId " +
           "GROUP BY m.team.id, m.team.teamName " +
           "ORDER BY SUM(r.distance) DESC")
    List<RankingDTO> getTeamRankingByCompetition(@Param("competitionId") Integer competitionId);

    /** 조별 랭킹 — 특정 대회 기준 */
    @Query("SELECT new com.running.club.domain.RankingDTO(m.runningGroup.id, m.runningGroup.groupName, SUM(r.distance), COUNT(r)) " +
           "FROM RunningRecord r JOIN r.member m " +
           "WHERE r.status = 'APPROVED' AND m.runningGroup IS NOT NULL AND r.competition.id = :competitionId " +
           "GROUP BY m.runningGroup.id, m.runningGroup.groupName " +
           "ORDER BY SUM(r.distance) DESC")
    List<RankingDTO> getGroupRankingByCompetition(@Param("competitionId") Integer competitionId);

    /** 개인별 랭킹 — 특정 대회 기준 */
    @Query("SELECT new com.running.club.domain.RankingDTO(m.id, m.name, SUM(r.distance), COUNT(r)) " +
           "FROM RunningRecord r JOIN r.member m " +
           "WHERE r.status = 'APPROVED' AND r.competition.id = :competitionId " +
           "GROUP BY m.id, m.name " +
           "ORDER BY SUM(r.distance) DESC")
    List<RankingDTO> getMemberRankingByCompetition(@Param("competitionId") Integer competitionId);

    // ── 개인 대시보드용 쿼리 ──────────────────────────────────────────────────

    /** 특정 멤버의 APPROVED 누적 거리 */
    @Query("SELECT COALESCE(SUM(r.distance), 0.0) FROM RunningRecord r WHERE r.member.id = :memberId AND r.status = 'APPROVED'")
    double getTotalApprovedDistanceByMember(@Param("memberId") Integer memberId);

    /** 특정 멤버의 APPROVED 기록 횟수 */
    @Query("SELECT COUNT(r) FROM RunningRecord r WHERE r.member.id = :memberId AND r.status = 'APPROVED'")
    long countApprovedByMember(@Param("memberId") Integer memberId);

    /**
     * 특정 멤버의 최근 APPROVED 기록 (Pageable로 상위 N건 제한).
     * ManyToOne FETCH JOIN이므로 Pageable 페이지네이션이 DB 레벨에서 동작.
     */
    @Query("SELECT r FROM RunningRecord r " +
           "JOIN FETCH r.member m " +
           "LEFT JOIN FETCH m.team " +
           "LEFT JOIN FETCH m.runningGroup " +
           "WHERE r.member.id = :memberId AND r.status = 'APPROVED' " +
           "ORDER BY r.runningDate DESC")
    List<RunningRecord> findRecentApproved(@Param("memberId") Integer memberId,
                                           org.springframework.data.domain.Pageable pageable);

    // ── 대회 현황(배틀) 전용 쿼리 ───────────────────────────────────────────

    /**
     * 조별 기여도 집계 — 팀 정보(colorCode) 포함.
     * INNER JOIN이므로 APPROVED 기록이 1건 이상 있는 조만 반환.
     */
    @Query("SELECT new com.running.club.domain.GroupContributionDTO(" +
           "rg.id, rg.groupName, t.id, t.teamName, t.colorCode, SUM(r.distance), COUNT(r)) " +
           "FROM RunningRecord r " +
           "JOIN r.member m " +
           "JOIN m.runningGroup rg " +
           "JOIN m.team t " +
           "WHERE r.competition.id = :competitionId AND r.status = 'APPROVED' " +
           "GROUP BY rg.id, rg.groupName, t.id, t.teamName, t.colorCode " +
           "ORDER BY SUM(r.distance) DESC")
    List<GroupContributionDTO> getGroupContributionsByCompetition(@Param("competitionId") Integer competitionId);

    /**
     * 오늘의 MVP 후보 — 당일 APPROVED 기록 누적 거리 내림차순.
     * Pageable(0, 1)로 호출하면 1위만 반환.
     */
    @Query("SELECT new com.running.club.domain.TodayMvpDTO(" +
           "m.id, m.name, t.teamName, t.colorCode, rg.groupName, SUM(r.distance)) " +
           "FROM RunningRecord r " +
           "JOIN r.member m " +
           "LEFT JOIN m.team t " +
           "LEFT JOIN m.runningGroup rg " +
           "WHERE r.competition.id = :competitionId " +
           "  AND r.status = 'APPROVED' " +
           "  AND r.runningDate = :today " +
           "GROUP BY m.id, m.name, t.teamName, t.colorCode, rg.groupName " +
           "ORDER BY SUM(r.distance) DESC")
    List<TodayMvpDTO> findTodayMvpCandidates(@Param("competitionId") Integer competitionId,
                                              @Param("today") LocalDate today,
                                              org.springframework.data.domain.Pageable pageable);

    // ── 활동 피드 전용 쿼리 ──────────────────────────────────────────────────

    /**
     * 최신 APPROVED 기록 N건 (피드 타임라인용).
     * createdAt DESC 정렬 — 가장 최근 승인 기록부터 반환.
     * Pageable(0, 10) 으로 호출하면 최대 10건.
     */
    @Query("SELECT r FROM RunningRecord r " +
           "JOIN FETCH r.member m " +
           "LEFT JOIN FETCH m.team " +
           "LEFT JOIN FETCH m.runningGroup " +
           "WHERE r.status = 'APPROVED' " +
           "ORDER BY r.createdAt DESC")
    List<RunningRecord> findLatestApproved(org.springframework.data.domain.Pageable pageable);

    /**
     * Daily King 후보 — 오늘 APPROVED 기록 누적 거리 내림차순 (대회 무관 전체).
     * Pageable(0, 1) 로 호출하면 1위만 반환.
     */
    @Query("SELECT new com.running.club.domain.TodayMvpDTO(" +
           "m.id, m.name, t.teamName, t.colorCode, rg.groupName, SUM(r.distance)) " +
           "FROM RunningRecord r " +
           "JOIN r.member m " +
           "LEFT JOIN m.team t " +
           "LEFT JOIN m.runningGroup rg " +
           "WHERE r.status = 'APPROVED' AND r.runningDate = :today " +
           "GROUP BY m.id, m.name, t.teamName, t.colorCode, rg.groupName " +
           "ORDER BY SUM(r.distance) DESC")
    List<TodayMvpDTO> findDailyKingAll(@Param("today") LocalDate today,
                                       org.springframework.data.domain.Pageable pageable);

    /**
     * 기간별 멤버 누적 거리 집계 (Rising Star 계산용).
     * Object[] 컬럼 순서: [0]=memberId, [1]=name, [2]=teamName, [3]=colorCode, [4]=totalKm
     * LEFT JOIN team → 팀 미배정 멤버도 포함 (t.id NULL 허용).
     */
    @Query("SELECT m.id, m.name, t.teamName, t.colorCode, SUM(r.distance) " +
           "FROM RunningRecord r " +
           "JOIN r.member m " +
           "LEFT JOIN m.team t " +
           "WHERE r.status = 'APPROVED' AND r.runningDate >= :from AND r.runningDate <= :to " +
           "GROUP BY m.id, m.name, t.id, t.teamName, t.colorCode")
    List<Object[]> findWeeklyDistancePerMember(@Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    /**
     * 오늘 해당 멤버의 기록(APPROVED or WAITING) 존재 여부.
     * WAITING 포함 — 제출 직후에도 "오늘 뛰었음"으로 처리.
     */
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM RunningRecord r " +
           "WHERE r.member.id = :memberId AND r.runningDate = :today " +
           "AND r.status IN ('APPROVED', 'WAITING')")
    boolean hasRunToday(@Param("memberId") Integer memberId, @Param("today") LocalDate today);

    @Modifying
    @Query("UPDATE RunningRecord r SET r.status = 'APPROVED', r.approvedBy = :admin, r.verifiedAt = :today WHERE r.id = :id AND r.status = 'WAITING'")
    int approve(@Param("id") Integer id, @Param("admin") Member admin, @Param("today") LocalDate today);

    @Modifying
    @Query("UPDATE RunningRecord r SET r.status = 'REJECTED', r.rejectedReason = :reason, r.approvedBy = :admin WHERE r.id = :id AND r.status = 'WAITING'")
    int reject(@Param("id") Integer id, @Param("reason") String reason, @Param("admin") Member admin);
}
