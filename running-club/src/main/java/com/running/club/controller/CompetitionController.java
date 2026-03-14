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
import lombok.extern.slf4j.Slf4j;

/**
 * 회원가입 지원 공개 조회 컨트롤러.
 *
 * <p>인증 불필요 (SecurityConfig에서 permitAll 설정).
 * 경로가 /api/competitions/** 와 /api/teams/** 두 prefix에 걸쳐 있어
 * 클래스 레벨 @RequestMapping 없이 각 메서드에 전체 경로를 명시.
 * 모든 응답은 ApiResponse<T>로 일관성 유지.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class CompetitionController {

    private final PublicCompetitionService   publicCompetitionService;
    private final CompetitionBattleService   competitionBattleService;

    /**
     * 전체 대회 목록 (상태 무관, 인증 불필요).
     * 대회 목록 페이지에서 PROCEEDING/READY/FINISHED 모두 표시.
     */
    @GetMapping("/api/competitions")
    public ResponseEntity<ApiResponse<List<CompetitionSummaryDTO>>> getAllCompetitions() {
        log.info("[COMPETITION] 전체 대회 목록 조회 요청");
        List<CompetitionSummaryDTO> result = publicCompetitionService.getAllCompetitions();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 대회 현황 배틀 데이터 (인증 불필요).
     * 팀 배틀 현황 + 조별 기여도 + 오늘의 MVP를 단일 호출로 반환.
     * /api/competitions/** permitAll 적용됨.
     */
    @GetMapping("/api/competitions/active/battle")
    public ResponseEntity<CompetitionBattleResponse> getActiveBattle() {
        log.info("[COMPETITION] 대회 현황 배틀 조회 요청");
        CompetitionBattleResponse result = competitionBattleService.getActiveBattle();
        return ResponseEntity.ok(result);
    }

    /**
     * 활성 대회 목록 조회.
     * 빈 리스트도 success=true로 반환 — 프론트에서 "등록된 대회 없음" UI 처리.
     */
    @GetMapping("/api/competitions/active")
    public ResponseEntity<ApiResponse<List<CompetitionForJoinDTO>>> getActiveCompetitions() {
        log.info("[COMPETITION] 활성 대회 목록 조회 요청");
        List<CompetitionForJoinDTO> result = publicCompetitionService.getActiveCompetitions();
        log.info("[COMPETITION] 활성 대회 목록 조회 완료 - 건수={}", result.size());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 특정 대회의 팀 목록 조회.
     * 종료 대회 / 존재하지 않는 ID → GlobalExceptionHandler가 400 ApiResponse로 변환.
     */
    @GetMapping("/api/competitions/{competitionId}/teams")
    public ResponseEntity<ApiResponse<List<TeamForJoinDTO>>> getTeams(
            @PathVariable Integer competitionId) {
        log.info("[COMPETITION] 대회 팀 목록 조회 요청 - competitionId={}", competitionId);
        List<TeamForJoinDTO> result = publicCompetitionService.getTeamsByCompetition(competitionId);
        log.info("[COMPETITION] 대회 팀 목록 조회 완료 - competitionId={}, 건수={}", competitionId, result.size());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 특정 대회의 전체 조 목록 조회 (팀명 포함).
     * 회원가입 시 대회 선택 후 조를 바로 선택하는 단계에서 사용.
     */
    @GetMapping("/api/competitions/{competitionId}/groups")
    public ResponseEntity<ApiResponse<List<GroupForJoinDTO>>> getGroupsByCompetition(
            @PathVariable Integer competitionId) {
        log.info("[COMPETITION] 대회 조 목록 조회 요청 - competitionId={}", competitionId);
        List<GroupForJoinDTO> result = publicCompetitionService.getGroupsByCompetition(competitionId);
        log.info("[COMPETITION] 대회 조 목록 조회 완료 - 건수={}", result.size());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 특정 팀의 조 목록 조회.
     * 빈 리스트 → success=true, data=[] 반환 (조 미구성 상태, 정상)
     * 존재하지 않는 teamId → GlobalExceptionHandler가 400 ApiResponse로 변환.
     */
    @GetMapping("/api/teams/{teamId}/groups")
    public ResponseEntity<ApiResponse<List<GroupForJoinDTO>>> getGroups(
            @PathVariable Integer teamId) {
        log.info("[COMPETITION] 팀 조 목록 조회 요청 - teamId={}", teamId);
        List<GroupForJoinDTO> result = publicCompetitionService.getGroupsByTeam(teamId);
        log.info("[COMPETITION] 팀 조 목록 조회 완료 - teamId={}, 건수={}", teamId, result.size());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
