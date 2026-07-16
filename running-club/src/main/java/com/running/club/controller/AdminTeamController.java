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

import com.running.club.dto.competition.RunningGroupCreateRequest;
import com.running.club.dto.competition.RunningGroupResponse;
import com.running.club.dto.competition.RunningGroupUpdateRequest;
import com.running.club.dto.competition.TeamCreateRequest;
import com.running.club.dto.competition.TeamResponse;
import com.running.club.dto.competition.TeamSummaryDTO;
import com.running.club.dto.competition.TeamUpdateRequest;
import com.running.club.service.AdminTeamService;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 팀/조 관리 컨트롤러.
 * 경로가 /competitions/**, /teams/**, /groups/** 로 분산되어 있어
 * 클래스 레벨 @RequestMapping 없이 각 메서드에 전체 경로를 명시.
 * 보안: SecurityConfig에서 /api/admin/** 전체에 ADMIN 권한 적용 중.
 */
@RestController
@RequiredArgsConstructor
public class AdminTeamController {

    private final AdminTeamService adminTeamService;

    // ── 팀(Team) 관리 ──────────────────────────────────────────────────────────

    /** 대회 내 팀 목록 조회 (그룹 수 포함) */
    @GetMapping("/api/admin/competitions/{competitionId}/teams")
    public ResponseEntity<List<TeamSummaryDTO>> getTeams(@PathVariable Integer competitionId) {
        return ResponseEntity.ok(adminTeamService.getTeamsByCompetition(competitionId));
    }

    /** 팀 생성 */
    @PostMapping("/api/admin/competitions/{competitionId}/teams")
    public ResponseEntity<TeamResponse> createTeam(
            @PathVariable Integer competitionId,
            @RequestBody TeamCreateRequest request) {
        return ResponseEntity.ok(adminTeamService.createTeam(competitionId, request));
    }

    /** 팀 수정 (이름·색상 코드 부분 변경 가능) */
    @PatchMapping("/api/admin/teams/{teamId}")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable Integer teamId,
            @RequestBody TeamUpdateRequest request) {
        return ResponseEntity.ok(adminTeamService.updateTeam(teamId, request));
    }

    /**
     * 팀 삭제.
     * 소속 멤버 존재 시 400 에러 반환.
     * 소속 그룹은 Cascade로 함께 삭제.
     */
    @DeleteMapping("/api/admin/teams/{teamId}")
    public ResponseEntity<String> deleteTeam(@PathVariable Integer teamId) {
        adminTeamService.deleteTeam(teamId);
        return ResponseEntity.ok("팀 #" + teamId + " 삭제 완료 (소속 그룹 포함)");
    }

    // ── 조(RunningGroup) 관리 ─────────────────────────────────────────────────

    /** 팀 내 그룹 목록 조회 */
    @GetMapping("/api/admin/teams/{teamId}/groups")
    public ResponseEntity<List<RunningGroupResponse>> getGroups(@PathVariable Integer teamId) {
        return ResponseEntity.ok(adminTeamService.getGroupsByTeam(teamId));
    }

    /** 그룹 생성 */
    @PostMapping("/api/admin/teams/{teamId}/groups")
    public ResponseEntity<RunningGroupResponse> createGroup(
            @PathVariable Integer teamId,
            @RequestBody RunningGroupCreateRequest request) {
        return ResponseEntity.ok(adminTeamService.createGroup(teamId, request));
    }

    /** 그룹 수정 (이름 변경) */
    @PatchMapping("/api/admin/groups/{groupId}")
    public ResponseEntity<RunningGroupResponse> updateGroup(
            @PathVariable Integer groupId,
            @RequestBody RunningGroupUpdateRequest request) {
        return ResponseEntity.ok(adminTeamService.updateGroup(groupId, request));
    }

    /**
     * 그룹 삭제.
     * 소속 멤버 존재 시 400 에러 반환.
     */
    @DeleteMapping("/api/admin/groups/{groupId}")
    public ResponseEntity<String> deleteGroup(@PathVariable Integer groupId) {
        adminTeamService.deleteGroup(groupId);
        return ResponseEntity.ok("조 #" + groupId + " 삭제 완료");
    }
}
