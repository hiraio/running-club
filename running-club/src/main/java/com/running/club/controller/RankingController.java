package com.running.club.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.domain.RankingDTO;
import com.running.club.service.RankingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ranking")
public class RankingController {

    private final RankingService rankingService;

    @GetMapping("/teams")
    public ResponseEntity<List<RankingDTO>> teamRanking() {
        return ResponseEntity.ok(rankingService.getTeamRanking());
    }

    @GetMapping("/groups")
    public ResponseEntity<List<RankingDTO>> groupRanking() {
        return ResponseEntity.ok(rankingService.getGroupRanking());
    }

    @GetMapping("/members")
    public ResponseEntity<List<RankingDTO>> memberRanking() {
        return ResponseEntity.ok(rankingService.getMemberRanking());
    }
}
