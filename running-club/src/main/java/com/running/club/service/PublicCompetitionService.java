package com.running.club.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.Competition;
import com.running.club.dto.auth.CompetitionForJoinDTO;
import com.running.club.domain.CompetitionStatus;
import com.running.club.dto.competition.CompetitionSummaryDTO;
import com.running.club.dto.auth.GroupForJoinDTO;
import com.running.club.dto.auth.TeamForJoinDTO;
import com.running.club.repository.CompetitionRepository;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.repository.TeamRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 회원가입 지원 조회 서비스 (공개 API, 인증 불필요).
 * 읽기 전용 작업만 수행.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicCompetitionService {

    private final CompetitionRepository competitionRepository;
    private final TeamRepository teamRepository;
    private final RunningGroupRepository runningGroupRepository;

    public List<CompetitionSummaryDTO> getAllCompetitions() {
        return competitionRepository.findAllWithTeamCount();
    }

    public List<CompetitionForJoinDTO> getActiveCompetitions() {
        return competitionRepository.findActiveCompetitions(LocalDate.now());
    }

    public List<TeamForJoinDTO> getTeamsByCompetition(Integer competitionId) {
        Competition competition = competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + competitionId + ")"));

        CompetitionStatus status = CompetitionStatus.of(
                competition.getStartDate(), competition.getEndDate(), competition.getIsActive());
        if (status == CompetitionStatus.FINISHED) {
            log.warn("[COMPETITION] 종료된 대회 팀 조회 - competitionId={}", competitionId);
            throw new IllegalStateException("종료된 대회입니다. 팀 목록을 조회할 수 없습니다. (id=" + competitionId + ")");
        }

        return teamRepository.findTeamsForJoin(competitionId);
    }

    public List<GroupForJoinDTO> getGroupsByCompetition(Integer competitionId) {
        Competition competition = competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + competitionId + ")"));

        CompetitionStatus status = CompetitionStatus.of(
                competition.getStartDate(), competition.getEndDate(), competition.getIsActive());
        if (status == CompetitionStatus.FINISHED) {
            throw new IllegalStateException("종료된 대회입니다. (id=" + competitionId + ")");
        }

        return runningGroupRepository.findGroupsByCompetitionId(competitionId);
    }

    public List<GroupForJoinDTO> getGroupsByTeam(Integer teamId) {
        teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 팀입니다. (id=" + teamId + ")"));
        return runningGroupRepository.findGroupsForJoin(teamId);
    }
}
