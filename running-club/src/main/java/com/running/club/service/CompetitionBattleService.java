package com.running.club.service;

import com.running.club.domain.*;
import com.running.club.repository.CompetitionRepository;
import com.running.club.repository.MemberRepository;
import com.running.club.repository.RunningRecordRepository;
import com.running.club.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompetitionBattleService {

    private final CompetitionRepository    competitionRepository;
    private final RunningRecordRepository  runningRecordRepository;
    private final TeamRepository           teamRepository;
    private final MemberRepository         memberRepository;
    private final RankSnapshotService      rankSnapshotService;

    /**
     * 현재 활성 대회의 배틀 현황을 한 번에 반환.
     * PROCEEDING 상태 우선, 없으면 READY 상태 대회를 사용.
     */
    public CompetitionBattleResponse getActiveBattle() {
        log.info("[BATTLE] 대회 현황 조회 시작");

        // 1. 진행 중인 대회 선택 (PROCEEDING > READY)
        Competition competition = competitionRepository.findAll().stream()
                .filter(c -> {
                    CompetitionStatus s = CompetitionStatus.of(
                            c.getStartDate(), c.getEndDate(), c.getIsActive());
                    return s == CompetitionStatus.PROCEEDING || s == CompetitionStatus.READY;
                })
                .min(Comparator.comparingInt(c ->
                        CompetitionStatus.of(c.getStartDate(), c.getEndDate(), c.getIsActive())
                                == CompetitionStatus.PROCEEDING ? 0 : 1))
                .orElseThrow(() -> new IllegalStateException("현재 진행 중인 대회가 없습니다."));

        log.info("[BATTLE] 대회 선택 - id={}, title={}", competition.getId(), competition.getTitle());

        // 2. 팀 배틀 데이터 (서브쿼리로 실시간 totalKm 집계 포함)
        List<TeamSummaryDTO> teams = teamRepository
                .findAllByCompetitionIdWithGroupCount(competition.getId());
        teams.sort(Comparator.comparingDouble(TeamSummaryDTO::getTotalKm).reversed());

        // 3. 조별 기여도 (팀 구분 없이 전체 조 통합 랭킹)
        List<GroupContributionDTO> groups = runningRecordRepository
                .getGroupContributionsByCompetition(competition.getId());
        for (int i = 0; i < groups.size(); i++) {
            groups.get(i).setRank(i + 1);
            groups.get(i).setTopContributor(i == 0);
        }

        // 조별 멤버 수 병합 (기록 없는 조 포함 전체 인원)
        Map<Integer, Long> memberCountMap = memberRepository.countMembersPerGroup().stream()
                .collect(Collectors.toMap(arr -> (Integer) arr[0], arr -> (Long) arr[1]));
        groups.forEach(g -> g.setMemberCount(memberCountMap.getOrDefault(g.getGroupId(), 0L)));

        // 조별 순위 변동 병합 (직전 스냅샷 기준)
        Map<Integer, Integer> prevGroupRanks = rankSnapshotService.getLatestRanks("GROUP", competition.getId());
        groups.forEach(g -> {
            Integer prev = prevGroupRanks.get(g.getGroupId());
            if (prev != null) g.setRankChange(prev - g.getRank());
        });

        // 4. 오늘의 MVP (당일 APPROVED 누적 최대)
        List<TodayMvpDTO> mvpList = runningRecordRepository.findTodayMvpCandidates(
                competition.getId(), LocalDate.now(), PageRequest.of(0, 1));
        TodayMvpDTO todayMvp = mvpList.isEmpty() ? null : mvpList.get(0);

        // 5. 상태 및 D-Day 계산
        CompetitionStatus status = CompetitionStatus.of(
                competition.getStartDate(), competition.getEndDate(), competition.getIsActive());
        long daysRemaining  = ChronoUnit.DAYS.between(LocalDate.now(), competition.getEndDate());
        long daysUntilStart = status == CompetitionStatus.READY
                ? ChronoUnit.DAYS.between(LocalDate.now(), competition.getStartDate())
                : 0L;

        log.info("[BATTLE] 조회 완료 - status={}, teams={}, groups={}, mvp={}, daysRemaining={}, daysUntilStart={}",
                status, teams.size(), groups.size(),
                todayMvp != null ? todayMvp.getName() : "없음", daysRemaining, daysUntilStart);

        return CompetitionBattleResponse.builder()
                .competitionId(competition.getId())
                .title(competition.getTitle())
                .status(status.name())
                .startDate(competition.getStartDate().toString())
                .endDate(competition.getEndDate().toString())
                .daysRemaining(daysRemaining)
                .daysUntilStart(daysUntilStart)
                .teams(teams)
                .groupRankings(groups)
                .todayMvp(todayMvp)
                .build();
    }
}
