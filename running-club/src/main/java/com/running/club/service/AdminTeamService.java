package com.running.club.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.Competition;
import com.running.club.domain.RunningGroup;
import com.running.club.domain.RunningGroupCreateRequest;
import com.running.club.domain.RunningGroupResponse;
import com.running.club.domain.RunningGroupUpdateRequest;
import com.running.club.domain.Team;
import com.running.club.domain.TeamCreateRequest;
import com.running.club.domain.TeamResponse;
import com.running.club.domain.TeamSummaryDTO;
import com.running.club.domain.TeamUpdateRequest;
import com.running.club.repository.CompetitionRepository;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.repository.TeamRepository;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 팀/조 관리 서비스.
 * 클래스 기본: readOnly=true, 쓰기 메서드에 @Transactional 개별 오버라이드.
 */
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

    /** 대회 내 팀 목록 조회 (그룹 수 포함) */
    public List<TeamSummaryDTO> getTeamsByCompetition(Integer competitionId) {
        // 존재하지 않는 대회 ID 조기 차단
        competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 대회입니다. (id=" + competitionId + ")"));

        return teamRepository.findAllByCompetitionIdWithGroupCount(competitionId);
    }

    /** 팀 생성 */
    @Transactional
    public TeamResponse createTeam(Integer competitionId, TeamCreateRequest request) {
        validateTeamName(request.getTeamName());

        Competition competition = competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 대회입니다. (id=" + competitionId + ")"));

        Team team = Team.builder()
                .competition(competition)
                .teamName(request.getTeamName())
                .colorCode(request.getColorCode())
                .build();

        return TeamResponse.from(teamRepository.save(team));
    }

    /** 팀 수정 (이름·색상 코드 부분 변경) */
    @Transactional
    public TeamResponse updateTeam(Integer teamId, TeamUpdateRequest request) {
        Team team = teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 팀입니다. (id=" + teamId + ")"));

        // teamName이 제공된 경우에만 검증 (null이면 변경 안 함)
        if (request.getTeamName() != null) validateTeamName(request.getTeamName());

        team.update(request.getTeamName(), request.getColorCode());

        // @Transactional 더티 체킹으로 자동 반영 — 별도 save() 불필요
        return TeamResponse.from(team);
    }

    /**
     * 팀 삭제.
     * - 소속 멤버가 1명이라도 있으면 삭제 불가 (참조 무결성 보호)
     * - 소속 그룹(RunningGroup)은 Team.groups의 CascadeType.ALL로 자동 삭제
     */
    @Transactional
    public void deleteTeam(Integer teamId) {
        teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 팀입니다. (id=" + teamId + ")"));

        long memberCount = teamRepository.countMembersByTeamId(teamId);
        if (memberCount > 0) {
            throw new IllegalStateException(
                    "소속 멤버가 있는 팀은 삭제할 수 없습니다. " +
                    "멤버를 먼저 이동하거나 탈퇴 처리하세요. (멤버 수: " + memberCount + ")");
        }

        // 그룹은 Cascade(ALL) + orphanRemoval=true 로 함께 삭제됨
        teamRepository.deleteById(teamId);
    }

    // ════════════════════════════════════════════════════════════════
    // 조(RunningGroup) 관련
    // ════════════════════════════════════════════════════════════════

    /** 팀 내 그룹 목록 조회 */
    public List<RunningGroupResponse> getGroupsByTeam(Integer teamId) {
        teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 팀입니다. (id=" + teamId + ")"));

        // findAllByTeamId는 JOIN FETCH team 포함 → from() 내 team 접근 시 쿼리 추가 없음
        return runningGroupRepository.findAllByTeamId(teamId).stream()
                .map(RunningGroupResponse::from)
                .toList();
    }

    /** 그룹 생성 */
    @Transactional
    public RunningGroupResponse createGroup(Integer teamId, RunningGroupCreateRequest request) {
        validateGroupName(request.getGroupName());

        Team team = teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 팀입니다. (id=" + teamId + ")"));

        RunningGroup group = RunningGroup.builder()
                .team(team)
                .groupName(request.getGroupName())
                .build();

        return RunningGroupResponse.from(runningGroupRepository.save(group));
    }

    /** 그룹 수정 (이름 변경) */
    @Transactional
    public RunningGroupResponse updateGroup(Integer groupId, RunningGroupUpdateRequest request) {
        validateGroupName(request.getGroupName());

        RunningGroup group = runningGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 조입니다. (id=" + groupId + ")"));

        group.update(request.getGroupName());

        // 더티 체킹 자동 반영
        return RunningGroupResponse.from(group);
    }

    /**
     * 그룹 삭제.
     * - 소속 멤버가 1명이라도 있으면 삭제 불가
     */
    @Transactional
    public void deleteGroup(Integer groupId) {
        runningGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 조입니다. (id=" + groupId + ")"));

        long memberCount = runningGroupRepository.countMembersByGroupId(groupId);
        if (memberCount > 0) {
            throw new IllegalStateException(
                    "소속 멤버가 있는 조는 삭제할 수 없습니다. " +
                    "멤버를 먼저 이동하거나 탈퇴 처리하세요. (멤버 수: " + memberCount + ")");
        }

        runningGroupRepository.deleteById(groupId);
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
