package com.running.club.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.domain.RankingDTO;
import com.running.club.service.RankingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ranking")
public class RankingController {

    private final RankingService rankingService;

    /**
     * 팀 랭킹.
     * - GET /api/ranking/teams            → 전체 대회 통합
     * - GET /api/ranking/teams?competitionId=1 → 특정 대회 기준
     */
    @GetMapping("/teams")
    public ResponseEntity<List<RankingDTO>> teamRanking(
            @RequestParam(required = false) Integer competitionId) {
        log.info("[RANKING] 팀 랭킹 조회 요청 - competitionId={}", competitionId);
        List<RankingDTO> result = rankingService.getTeamRanking(competitionId);
        log.info("[RANKING] 팀 랭킹 조회 완료 - 건수={}", result.size());
        return ResponseEntity.ok(result);
    }

    /**
     * 조 랭킹.
     * - GET /api/ranking/groups            → 전체 집계
     * - GET /api/ranking/groups?competitionId=1 → 특정 대회 기준
     */
    @GetMapping("/groups")
    public ResponseEntity<List<RankingDTO>> groupRanking(
            @RequestParam(required = false) Integer competitionId) {
        log.info("[RANKING] 조 랭킹 조회 요청 - competitionId={}", competitionId);
        List<RankingDTO> result = rankingService.getGroupRanking(competitionId);
        log.info("[RANKING] 조 랭킹 조회 완료 - 건수={}", result.size());
        return ResponseEntity.ok(result);
    }

    /**
     * 개인 랭킹.
     * - GET /api/ranking/members            → 전체 집계
     * - GET /api/ranking/members?competitionId=1 → 특정 대회 기준
     */
    @GetMapping("/members")
    public ResponseEntity<List<RankingDTO>> memberRanking(
            @RequestParam(required = false) Integer competitionId) {
        log.info("[RANKING] 개인 랭킹 조회 요청 - competitionId={}", competitionId);
        List<RankingDTO> result = rankingService.getMemberRanking(competitionId);
        log.info("[RANKING] 개인 랭킹 조회 완료 - 건수={}", result.size());
        return ResponseEntity.ok(result);
    }
}
