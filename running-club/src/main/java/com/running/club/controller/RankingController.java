package com.running.club.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.dto.ranking.RankingDTO;
import com.running.club.service.RankingService;

import lombok.RequiredArgsConstructor;

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
        return ResponseEntity.ok(rankingService.getTeamRanking(competitionId));
    }

    /**
     * 조 랭킹.
     * - GET /api/ranking/groups            → 전체 집계
     * - GET /api/ranking/groups?competitionId=1 → 특정 대회 기준
     */
    @GetMapping("/groups")
    public ResponseEntity<List<RankingDTO>> groupRanking(
            @RequestParam(required = false) Integer competitionId) {
        return ResponseEntity.ok(rankingService.getGroupRanking(competitionId));
    }

    /**
     * 개인 랭킹.
     * - GET /api/ranking/members            → 전체 집계
     * - GET /api/ranking/members?competitionId=1 → 특정 대회 기준
     */
    @GetMapping("/members")
    public ResponseEntity<List<RankingDTO>> memberRanking(
            @RequestParam(required = false) Integer competitionId) {
        return ResponseEntity.ok(rankingService.getMemberRanking(competitionId));
    }
}
