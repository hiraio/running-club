package com.running.club.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.running.club.domain.BingoBoard;

public interface BingoBoardRepository extends JpaRepository<BingoBoard, Integer> {

    /** 가장 최근 빙고판 조회 (현재 활성 빙고) */
    Optional<BingoBoard> findFirstByOrderByCreatedAtDesc();
}
