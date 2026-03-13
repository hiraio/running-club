package com.running.club.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.domain.RunningGroupCreateRequest;
import com.running.club.domain.RunningGroupResponse;
import com.running.club.domain.RunningGroupUpdateRequest;
import com.running.club.domain.TeamCreateRequest;
import com.running.club.domain.TeamResponse;
import com.running.club.domain.TeamSummaryDTO;
import com.running.club.domain.TeamUpdateRequest;
import com.running.club.service.AdminTeamService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 관리자 팀/조 관리 컨트롤러.
 * 경로가 /competitions/**, /teams/**, /groups/** 로 분산되어 있어
 * 클래스 레벨 @RequestMapping 없이 각 메서드에 전체 경로를 명시.
 * 보안: SecurityConfig에서 /api/admin/** 전체에 ADMIN 권한 적용 중.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class AdminTeamController {

    private final AdminTeamService adminTeamService;

    // ── 팀(Team) 관리 ──────────────────────────────────────────────────────────

    /** 대회 내 팀 목록 조회 (그룹 수 포함) */
    @GetMapping("/api/admin/competitions/{competitionId}/teams")
    public ResponseEntity<List<TeamSummaryDTO>> getTeams(@PathVariable Integer competitionId) {
        log.info("[ADMIN-TEAM] 팀 목록 조회 요청 - competitionId={}", competitionId);
        List<TeamSummaryDTO> result = adminTeamService.getTeamsByCompetition(competitionId);
        log.info("[ADMIN-TEAM] 팀 목록 조회 완료 - competitionId={}, 건수={}", competitionId, result.size());
        return ResponseEntity.ok(result);
    }

    /** 팀 생성 */
    @PostMapping("/api/admin/competitions/{competitionId}/teams")
    public ResponseEntity<TeamResponse> createTeam(
            @PathVariable Integer competitionId,
            @RequestBody TeamCreateRequest request) {
        log.info("[ADMIN-TEAM] 팀 생성 요청 - competitionId={}, teamName={}, colorCode={}",
                competitionId, request.getTeamName(), request.getColorCode());
        TeamResponse result = adminTeamService.createTeam(competitionId, request);
        log.info("[ADMIN-TEAM] 팀 생성 완료 - teamId={}, teamName={}", result.getId(), result.getTeamName());
        return ResponseEntity.ok(result);
    }

    /** 팀 수정 (이름·색상 코드 부분 변경 가능) */
    @PatchMapping("/api/admin/teams/{teamId}")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable Integer teamId,
            @RequestBody TeamUpdateRequest request) {
        log.info("[ADMIN-TEAM] 팀 수정 요청 - teamId={}, teamName={}, colorCode={}",
                teamId, request.getTeamName(), request.getColorCode());
        TeamResponse result = adminTeamService.updateTeam(teamId, request);
        log.info("[ADMIN-TEAM] 팀 수정 완료 - teamId={}", teamId);
        return ResponseEntity.ok(result);
    }

    /**
     * 팀 삭제.
     * 소속 멤버 존재 시 400 에러 반환.
     * 소속 그룹은 Cascade로 함께 삭제.
     */
    @DeleteMapping("/api/admin/teams/{teamId}")
    public ResponseEntity<String> deleteTeam(@PathVariable Integer teamId) {
        log.info("[ADMIN-TEAM] 팀 삭제 요청 - teamId={}", teamId);
        adminTeamService.deleteTeam(teamId);
        log.info("[ADMIN-TEAM] 팀 삭제 완료 - teamId={}", teamId);
        return ResponseEntity.ok("팀 #" + teamId + " 삭제 완료 (소속 그룹 포함)");
    }

    // ── 조(RunningGroup) 관리 ─────────────────────────────────────────────────

    /** 팀 내 그룹 목록 조회 */
    @GetMapping("/api/admin/teams/{teamId}/groups")
    public ResponseEntity<List<RunningGroupResponse>> getGroups(@PathVariable Integer teamId) {
        log.info("[ADMIN-GROUP] 조 목록 조회 요청 - teamId={}", teamId);
        List<RunningGroupResponse> result = adminTeamService.getGroupsByTeam(teamId);
        log.info("[ADMIN-GROUP] 조 목록 조회 완료 - teamId={}, 건수={}", teamId, result.size());
        return ResponseEntity.ok(result);
    }

    /** 그룹 생성 */
    @PostMapping("/api/admin/teams/{teamId}/groups")
    public ResponseEntity<RunningGroupResponse> createGroup(
            @PathVariable Integer teamId,
            @RequestBody RunningGroupCreateRequest request) {
        log.info("[ADMIN-GROUP] 조 생성 요청 - teamId={}, groupName={}", teamId, request.getGroupName());
        RunningGroupResponse result = adminTeamService.createGroup(teamId, request);
        log.info("[ADMIN-GROUP] 조 생성 완료 - groupId={}, groupName={}", result.getId(), result.getGroupName());
        return ResponseEntity.ok(result);
    }

    /** 그룹 수정 (이름 변경) */
    @PatchMapping("/api/admin/groups/{groupId}")
    public ResponseEntity<RunningGroupResponse> updateGroup(
            @PathVariable Integer groupId,
            @RequestBody RunningGroupUpdateRequest request) {
        log.info("[ADMIN-GROUP] 조 수정 요청 - groupId={}, groupName={}", groupId, request.getGroupName());
        RunningGroupResponse result = adminTeamService.updateGroup(groupId, request);
        log.info("[ADMIN-GROUP] 조 수정 완료 - groupId={}", groupId);
        return ResponseEntity.ok(result);
    }

    /**
     * 그룹 삭제.
     * 소속 멤버 존재 시 400 에러 반환.
     */
    @DeleteMapping("/api/admin/groups/{groupId}")
    public ResponseEntity<String> deleteGroup(@PathVariable Integer groupId) {
        log.info("[ADMIN-GROUP] 조 삭제 요청 - groupId={}", groupId);
        adminTeamService.deleteGroup(groupId);
        log.info("[ADMIN-GROUP] 조 삭제 완료 - groupId={}", groupId);
        return ResponseEntity.ok("조 #" + groupId + " 삭제 완료");
    }
}
