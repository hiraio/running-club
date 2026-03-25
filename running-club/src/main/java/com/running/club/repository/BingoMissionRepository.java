package com.running.club.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.BingoMission;

public interface BingoMissionRepository extends JpaRepository<BingoMission, Integer> {

    /** 빙고판의 미션 목록 (position 순) */
    @Query("SELECT m FROM BingoMission m WHERE m.board.id = :boardId ORDER BY m.position")
    List<BingoMission> findByBoardId(@Param("boardId") Integer boardId);
}
