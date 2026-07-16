package com.running.club.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.Competition;
import com.running.club.domain.RunningGroup;
import com.running.club.dto.competition.RunningGroupCreateRequest;
import com.running.club.dto.competition.RunningGroupResponse;
import com.running.club.dto.competition.RunningGroupUpdateRequest;
import com.running.club.domain.Team;
import com.running.club.dto.competition.TeamCreateRequest;
import com.running.club.dto.competition.TeamResponse;
import com.running.club.dto.competition.TeamSummaryDTO;
import com.running.club.dto.competition.TeamUpdateRequest;
import com.running.club.repository.CompetitionRepository;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.repository.TeamRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 관리자 팀/조 관리 서비스.
 * 클래스 기본: readOnly=true, 쓰기 메서드에 @Transactional 개별 오버라이드.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminTeamService {

    private final CompetitionRepository competitionRepository;
    private final TeamRepository teamRepository;
    private final RunningGroupRepository runningGroupRepository;

    // ════════════════════════════════════════════════════════════════
    // 팀(Team) 관련
    // ════════════════════════════════════════════════════════════════

    /** 대회 내 팀 목록 조회 (그룹 수 포함, 대회 기간 내 기록만 집계) */
    public List<TeamSummaryDTO> getTeamsByCompetition(Integer competitionId) {
        Competition comp = competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + competitionId + ")"));
        return teamRepository.findAllByCompetitionIdWithGroupCount(competitionId, comp.getStartDate(), comp.getEndDate());
    }

    /** 팀 생성 */
    @Transactional
    public TeamResponse createTeam(Integer competitionId, TeamCreateRequest request) {
        log.info("[TEAM-SVC] 팀 생성 - competitionId={}, teamName={}", competitionId, request.getTeamName());
        validateTeamName(request.getTeamName());

        Competition competition = competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> {
                    log.warn("[TEAM-SVC] 대회 없음 - competitionId={}", competitionId);
                    return new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + competitionId + ")");
                });

        Team team = Team.builder()
                .competition(competition)
                .teamName(request.getTeamName())
                .colorCode(request.getColorCode())
                .build();

        TeamResponse result = TeamResponse.from(teamRepository.save(team));
        log.info("[TEAM-SVC] 팀 생성 완료 - teamId={}", result.getId());
        return result;
    }

    /** 팀 수정 (이름·색상 코드 부분 변경) */
    @Transactional
    public TeamResponse updateTeam(Integer teamId, TeamUpdateRequest request) {
        log.info("[TEAM-SVC] 팀 수정 - teamId={}", teamId);
        Team team = teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> {
                    log.warn("[TEAM-SVC] 팀 없음 - teamId={}", teamId);
                    return new IllegalArgumentException("존재하지 않는 팀입니다. (id=" + teamId + ")");
                });

        if (request.getTeamName() != null) validateTeamName(request.getTeamName());

        team.update(request.getTeamName(), request.getColorCode());
        log.info("[TEAM-SVC] 팀 수정 완료 - teamId={}", teamId);
        return TeamResponse.from(team);
    }

    /**
     * 팀 삭제.
     * - 소속 멤버가 1명이라도 있으면 삭제 불가 (참조 무결성 보호)
     * - 소속 그룹(RunningGroup)은 Team.groups의 CascadeType.ALL로 자동 삭제
     */
    @Transactional
    public void deleteTeam(Integer teamId) {
        log.info("[TEAM-SVC] 팀 삭제 시도 - teamId={}", teamId);
        teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> {
                    log.warn("[TEAM-SVC] 팀 없음 - teamId={}", teamId);
                    return new IllegalArgumentException("존재하지 않는 팀입니다. (id=" + teamId + ")");
                });

        long memberCount = teamRepository.countMembersByTeamId(teamId);
        if (memberCount > 0) {
            log.warn("[TEAM-SVC] 팀 삭제 불가 - teamId={}, 소속 멤버 수={}", teamId, memberCount);
            throw new IllegalStateException(
                    "소속 멤버가 있는 팀은 삭제할 수 없습니다. " +
                    "멤버를 먼저 이동하거나 탈퇴 처리하세요. (멤버 수: " + memberCount + ")");
        }

        teamRepository.deleteById(teamId);
        log.info("[TEAM-SVC] 팀 삭제 완료 - teamId={}", teamId);
    }

    // ════════════════════════════════════════════════════════════════
    // 조(RunningGroup) 관련
    // ════════════════════════════════════════════════════════════════

    /** 팀 내 그룹 목록 조회 */
    public List<RunningGroupResponse> getGroupsByTeam(Integer teamId) {
        teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 팀입니다. (id=" + teamId + ")"));
        return runningGroupRepository.findAllByTeamId(teamId).stream()
                .map(RunningGroupResponse::from)
                .toList();
    }

    /** 그룹 생성 */
    @Transactional
    public RunningGroupResponse createGroup(Integer teamId, RunningGroupCreateRequest request) {
        log.info("[GROUP-SVC] 조 생성 - teamId={}, groupName={}", teamId, request.getGroupName());
        validateGroupName(request.getGroupName());

        Team team = teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> {
                    log.warn("[GROUP-SVC] 팀 없음 - teamId={}", teamId);
                    return new IllegalArgumentException("존재하지 않는 팀입니다. (id=" + teamId + ")");
                });

        RunningGroup group = RunningGroup.builder()
                .team(team)
                .groupName(request.getGroupName())
                .build();

        RunningGroupResponse result = RunningGroupResponse.from(runningGroupRepository.save(group));
        log.info("[GROUP-SVC] 조 생성 완료 - groupId={}", result.getId());
        return result;
    }

    /** 그룹 수정 (이름 변경) */
    @Transactional
    public RunningGroupResponse updateGroup(Integer groupId, RunningGroupUpdateRequest request) {
        log.info("[GROUP-SVC] 조 수정 - groupId={}, groupName={}", groupId, request.getGroupName());
        validateGroupName(request.getGroupName());

        RunningGroup group = runningGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> {
                    log.warn("[GROUP-SVC] 조 없음 - groupId={}", groupId);
                    return new IllegalArgumentException("존재하지 않는 조입니다. (id=" + groupId + ")");
                });

        group.update(request.getGroupName());
        log.info("[GROUP-SVC] 조 수정 완료 - groupId={}", groupId);
        return RunningGroupResponse.from(group);
    }

    /**
     * 그룹 삭제.
     * - 소속 멤버가 1명이라도 있으면 삭제 불가
     */
    @Transactional
    public void deleteGroup(Integer groupId) {
        log.info("[GROUP-SVC] 조 삭제 시도 - groupId={}", groupId);
        runningGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> {
                    log.warn("[GROUP-SVC] 조 없음 - groupId={}", groupId);
                    return new IllegalArgumentException("존재하지 않는 조입니다. (id=" + groupId + ")");
                });

        long memberCount = runningGroupRepository.countMembersByGroupId(groupId);
        if (memberCount > 0) {
            log.warn("[GROUP-SVC] 조 삭제 불가 - groupId={}, 소속 멤버 수={}", groupId, memberCount);
            throw new IllegalStateException(
                    "소속 멤버가 있는 조는 삭제할 수 없습니다. " +
                    "멤버를 먼저 이동하거나 탈퇴 처리하세요. (멤버 수: " + memberCount + ")");
        }

        runningGroupRepository.deleteById(groupId);
        log.info("[GROUP-SVC] 조 삭제 완료 - groupId={}", groupId);
    }

    // ════════════════════════════════════════════════════════════════
    // 공통 검증
    // ════════════════════════════════════════════════════════════════

    private void validateTeamName(String teamName) {
        if (teamName == null || teamName.isBlank()) {
            throw new IllegalArgumentException("팀 이름은 필수입니다.");
        }
    }

    private void validateGroupName(String groupName) {
        if (groupName == null || groupName.isBlank()) {
            throw new IllegalArgumentException("조 이름은 필수입니다.");
        }
    }
}
