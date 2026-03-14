package com.running.club.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.running.club.domain.Notice;
import com.running.club.domain.NoticeSummaryDTO;

public interface NoticeRepository extends JpaRepository<Notice, Integer> {

    /**
     * 공지사항 목록: 고정글(isPinned=true) 우선, 최신순 정렬.
     * content 제외한 경량 DTO로 조회.
     */
    @Query("SELECT new com.running.club.domain.NoticeSummaryDTO(n.id, n.title, n.isPinned, n.createdAt) " +
           "FROM Notice n " +
           "ORDER BY n.isPinned DESC, n.createdAt DESC")
    List<NoticeSummaryDTO> findAllSummary();

    /**
     * 단건 조회 — 메서드 명명 규칙 대신 JPQL 명시.
     */
    @Query("SELECT n FROM Notice n WHERE n.id = :id")
    Optional<Notice> findByNoticeId(@Param("id") Integer id);
}
