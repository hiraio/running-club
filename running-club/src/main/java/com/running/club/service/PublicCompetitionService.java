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

/**
 * 회원가입 지원 조회 서비스 (공개 API, 인증 불필요).
 *
 * <p>읽기 전용 작업만 수행하므로 클래스 레벨에 readOnly=true 고정.
 * 쓰기 트랜잭션 메서드가 추가될 일이 없는 서비스이므로 @Transactional 개별 오버라이드 불필요.
 */
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

    /**
     * 활성 대회 목록 조회.
     *
     * <p>조건: isActive=true AND endDate >= 오늘 → READY(시작 전) + PROCEEDING(진행 중) 반환.
     * 결과가 빈 리스트여도 정상 응답 — 활성 대회가 없는 것은 예외 상황이 아님.
     */
    public List<CompetitionForJoinDTO> getActiveCompetitions() {
        // today 파라미터를 서비스에서 주입 → Repository 테스트 시 날짜 모킹 용이
        return competitionRepository.findActiveCompetitions(LocalDate.now());
    }

    // ════════════════════════════════════════════════════════════════
    // GET /api/competitions/{id}/teams
    // ════════════════════════════════════════════════════════════════

    /**
     * 특정 대회의 팀 목록 조회.
     *
     * <p>두 단계 검증:
     * <ol>
     *   <li>대회 존재 여부 → 없으면 IllegalArgumentException (400)</li>
     *   <li>대회 상태가 FINISHED → 가입 불가 IllegalStateException (400)</li>
     * </ol>
     * 빈 팀 목록([] )은 정상 응답 — 관리자가 팀을 아직 등록하지 않은 상태.
     */
    public List<TeamForJoinDTO> getTeamsByCompetition(Integer competitionId) {
        Competition competition = competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 대회입니다. (id=" + competitionId + ")"));

        // 종료 대회 접근 차단 (isActive=false 또는 endDate 경과)
        CompetitionStatus status = CompetitionStatus.of(
                competition.getStartDate(), competition.getEndDate(), competition.getIsActive());
        if (status == CompetitionStatus.FINISHED) {
            throw new IllegalStateException(
                    "종료된 대회입니다. 팀 목록을 조회할 수 없습니다. (id=" + competitionId + ")");
        }

        // DTO Projection 쿼리 — 엔티티 로딩 없이 필요한 컬럼만 SELECT
        return teamRepository.findTeamsForJoin(competitionId);
    }

    // ════════════════════════════════════════════════════════════════
    // GET /api/teams/{id}/groups
    // ════════════════════════════════════════════════════════════════

    /**
     * 특정 팀의 조 목록 조회.
     *
     * <p>팀 존재 여부만 검증. 조가 없는 경우(빈 리스트)는 정상 응답 —
     * 관리자가 아직 조를 구성하지 않은 상태이며, 이 경우 프론트는 조 선택 단계를 건너뛸 수 있음.
     */
    public List<GroupForJoinDTO> getGroupsByTeam(Integer teamId) {
        teamRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 팀입니다. (id=" + teamId + ")"));

        return runningGroupRepository.findGroupsForJoin(teamId);
    }
}
