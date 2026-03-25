package com.running.club.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.BingoSubmission;
import com.running.club.domain.BingoSubmissionStatus;

public interface BingoSubmissionRepository extends JpaRepository<BingoSubmission, Integer> {

    /** 특정 빙고판의 모든 제출 (조별 현황 조회용) */
    @Query("SELECT s FROM BingoSubmission s " +
           "JOIN FETCH s.mission m " +
           "JOIN FETCH s.group g " +
           "JOIN FETCH s.submittedBy " +
           "WHERE m.board.id = :boardId")
    List<BingoSubmission> findByBoardId(@Param("boardId") Integer boardId);

    /** 특정 조의 제출 목록 */
    @Query("SELECT s FROM BingoSubmission s " +
           "JOIN FETCH s.mission m " +
           "JOIN FETCH s.submittedBy " +
           "WHERE m.board.id = :boardId AND s.group.id = :groupId")
    List<BingoSubmission> findByBoardIdAndGroupId(
            @Param("boardId") Integer boardId,
            @Param("groupId") Integer groupId);

    /** 미션+조 단건 조회 (중복 제출 방지 & 재제출용) */
    @Query("SELECT s FROM BingoSubmission s " +
           "WHERE s.mission.id = :missionId AND s.group.id = :groupId")
    Optional<BingoSubmission> findByMissionIdAndGroupId(
            @Param("missionId") Integer missionId,
            @Param("groupId") Integer groupId);

    /** 상태별 목록 (관리자 승인 대기 목록 등) */
    @Query("SELECT s FROM BingoSubmission s " +
           "JOIN FETCH s.mission m " +
           "JOIN FETCH s.group g " +
           "JOIN FETCH s.submittedBy " +
           "WHERE m.board.id = :boardId AND s.status = :status " +
           "ORDER BY s.submittedAt DESC")
    List<BingoSubmission> findByBoardIdAndStatus(
            @Param("boardId") Integer boardId,
            @Param("status") BingoSubmissionStatus status);
}
