package com.running.club.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.domain.ApiResponse;
import com.running.club.domain.CompetitionBattleResponse;
import com.running.club.domain.CompetitionForJoinDTO;
import com.running.club.domain.CompetitionSummaryDTO;
import com.running.club.domain.GroupForJoinDTO;
import com.running.club.domain.TeamForJoinDTO;
import com.running.club.service.CompetitionBattleService;
import com.running.club.service.PublicCompetitionService;

import lombok.RequiredArgsConstructor;

/**
 * 회원가입 지원 공개 조회 컨트롤러.
 *
 * <p>인증 불필요 (SecurityConfig에서 permitAll 설정).
 * 경로가 /api/competitions/** 와 /api/teams/** 두 prefix에 걸쳐 있어
 * 클래스 레벨 @RequestMapping 없이 각 메서드에 전체 경로를 명시.
 * 모든 응답은 ApiResponse<T>로 일관성 유지.
 */
@RestController
@RequiredArgsConstructor
public class CompetitionController {

    private final PublicCompetitionService   publicCompetitionService;
    private final CompetitionBattleService   competitionBattleService;

    /** 전체 대회 목록 (상태 무관, 인증 불필요) */
    @GetMapping("/api/competitions")
    public ResponseEntity<ApiResponse<List<CompetitionSummaryDTO>>> getAllCompetitions() {
        return ResponseEntity.ok(ApiResponse.ok(publicCompetitionService.getAllCompetitions()));
    }

    /** 대회 현황 배틀 데이터 — 팀 배틀 현황 + 조별 기여도 + 오늘의 MVP */
    @GetMapping("/api/competitions/active/battle")
    public ResponseEntity<CompetitionBattleResponse> getActiveBattle() {
        return ResponseEntity.ok(competitionBattleService.getActiveBattle());
    }

    /** 활성 대회 목록 (PROCEEDING / READY) */
    @GetMapping("/api/competitions/active")
    public ResponseEntity<ApiResponse<List<CompetitionForJoinDTO>>> getActiveCompetitions() {
        return ResponseEntity.ok(ApiResponse.ok(publicCompetitionService.getActiveCompetitions()));
    }

    /**
     * 특정 대회의 팀 목록 조회.
     * 종료 대회 / 존재하지 않는 ID → GlobalExceptionHandler가 400 ApiResponse로 변환.
     */
    @GetMapping("/api/competitions/{competitionId}/teams")
    public ResponseEntity<ApiResponse<List<TeamForJoinDTO>>> getTeams(
            @PathVariable Integer competitionId) {
        return ResponseEntity.ok(ApiResponse.ok(publicCompetitionService.getTeamsByCompetition(competitionId)));
    }

    /** 특정 대회의 전체 조 목록 조회 (팀명 포함) */
    @GetMapping("/api/competitions/{competitionId}/groups")
    public ResponseEntity<ApiResponse<List<GroupForJoinDTO>>> getGroupsByCompetition(
            @PathVariable Integer competitionId) {
        return ResponseEntity.ok(ApiResponse.ok(publicCompetitionService.getGroupsByCompetition(competitionId)));
    }

    /** 특정 팀의 조 목록 조회 */
    @GetMapping("/api/teams/{teamId}/groups")
    public ResponseEntity<ApiResponse<List<GroupForJoinDTO>>> getGroups(
            @PathVariable Integer teamId) {
        return ResponseEntity.ok(ApiResponse.ok(publicCompetitionService.getGroupsByTeam(teamId)));
    }
}
