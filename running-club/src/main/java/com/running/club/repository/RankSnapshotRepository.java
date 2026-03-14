package com.running.club.repository;

import com.running.club.domain.RankSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RankSnapshotRepository extends JpaRepository<RankSnapshot, Long> {

    /**
     * 오늘 이전(< today) 스냅샷 중 특정 대회+타입의 전체 목록을 최신순 반환.
     * 서비스에서 putIfAbsent 패턴으로 entityId별 가장 최근 스냅샷만 추출.
     */
    @Query("SELECT s FROM RankSnapshot s " +
           "WHERE s.entityType = :type " +
           "  AND s.competition.id = :competitionId " +
           "  AND s.snapshotDate < :today " +
           "ORDER BY s.snapshotDate DESC")
    List<RankSnapshot> findLatestBeforeToday(
            @Param("type") String type,
            @Param("competitionId") Integer competitionId,
            @Param("today") LocalDate today);

    /**
     * 스케줄러 재실행 시 해당 날짜의 기존 스냅샷 삭제 (덮어쓰기용).
     */
    @Modifying
    @Query("DELETE FROM RankSnapshot s " +
           "WHERE s.entityType = :type " +
           "  AND s.competition.id = :competitionId " +
           "  AND s.snapshotDate = :date")
    void deleteByTypeAndCompetitionAndDate(
            @Param("type") String type,
            @Param("competitionId") Integer competitionId,
            @Param("date") LocalDate date);
}
