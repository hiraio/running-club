package com.running.club.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.Competition;
import com.running.club.domain.CompetitionForJoinDTO;
import com.running.club.domain.CompetitionStatus;
import com.running.club.domain.GroupForJoinDTO;
import com.running.club.domain.TeamForJoinDTO;
import com.running.club.repository.CompetitionRepository;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.repository.TeamRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 회원가입 지원 조회 서비스 (공개 API, 인증 불필요).
 *
 * <p>읽기 전용 작업만 수행하므로 클래스 레벨에 readOnly=true 고정.
 * 쓰기 트랜잭션 메서드가 추가될 일이 없는 서비스이므로 @Transactional 개별 오버라이드 불필요.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicCompetitionService {

    private final CompetitionRepository competitionRepository;
    private final TeamRepository teamRepository;
    private final RunningGroupRepository runningGroupRepository;

    // ════════════════════════════════════════════════════════════════
    // GET /api/competitions/active
    // ════════════════════════════════════════════════════════════════

    public List<CompetitionForJoinDTO> getActiveCompetitions() {
        log.info("[PUBLIC-SVC] 활성 대회 목록 조회 - 기준일={}", LocalDate.now());
        List<CompetitionForJoinDTO> result = competitionRepository.findActiveCompetitions(LocalDate.now());
        log.info("[PUBLIC-SVC] 활성 대회 목록 조회 완료 - 건수={}", result.size());
        return result;
    }

    // ════════════════════════════════════════════════════════════════
    // GET /api/competitions/{id}/teams
    // ════════════════════════════════════════════════════════════════

    public List<TeamForJoinDTO> getTeamsByCompetition(Integer competitionId) {
        log.info("[PUBLIC-SVC] 대회 팀 목록 조회 - competitionId={}", competitionId);
        Competition competition = competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> {
                    log.warn("[PUBLIC-SVC] 대회 없음 - competitionId={}", competitionId);
                    return new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + competitionId + ")");
                });

        CompetitionStatus status = CompetitionStatus.of(
                competition.getStartDate(), competition.getEndDate(), competition.getIsActive());
        log.info("[PUBLIC-SVC] 대회 상태 확인 - competitionId={}, status={}", competitionId, status);
        if (status == CompetitionStatus.FINISHED) {
            log.warn("[PUBLIC-SVC] 종료된 대회 팀 조회 시도 - competitionId={}", competitionId);
            throw new IllegalStateException(
                    "종료된 대회입니다. 팀 목록을 조회할 수 없습니다. (id=" + competitionId + ")");
        }

        List<TeamForJoinDTO> result = teamRepository.findTeamsForJoin(competitionId);
        log.info("[PUBLIC-SVC] 대회 팀 목록 조회 완료 - competitionId={}, 건수={}", competitionId, result.size());
        return result;
    }

    // ════════════════════════════════════════════════════════════════
    // GET /api/teams/{id}/groups
    // ════════════════════════════════════════════════════════════════

    public List<GroupForJoinDTO> getGroupsByTeam(Integer teamId) {
        log.info("[PUBLIC-SVC] 팀 조 목록 조회 - teamId={}", teamId);
        teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> {
                    log.warn("[PUBLIC-SVC] 팀 없음 - teamId={}", teamId);
                    return new IllegalArgumentException("존재하지 않는 팀입니다. (id=" + teamId + ")");
                });

        List<GroupForJoinDTO> result = runningGroupRepository.findGroupsForJoin(teamId);
        log.info("[PUBLIC-SVC] 팀 조 목록 조회 완료 - teamId={}, 건수={}", teamId, result.size());
        return result;
    }
}
