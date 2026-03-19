package com.running.club.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.Competition;
import com.running.club.domain.RankingDTO;
import com.running.club.repository.CompetitionRepository;
import com.running.club.repository.RunningRecordRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankingService {

    private final RunningRecordRepository runningRecordRepository;
    private final CompetitionRepository   competitionRepository;
    private final RankSnapshotService     rankSnapshotService;

    public List<RankingDTO> getMemberRanking(Integer competitionId) {
        if (competitionId != null) {
            findCompetition(competitionId);
            List<RankingDTO> result = assignRanks(
                    runningRecordRepository.getMemberRankingByCompetition(competitionId));
            mergeRankChange(result, "MEMBER", competitionId);
            return result;
        }
        // competitionId 미지정 시 rankChange 없음 (어느 대회 기준인지 불명확)
        return assignRanks(runningRecordRepository.getMemberRanking());
    }

    public List<RankingDTO> getGroupRanking(Integer competitionId) {
        if (competitionId != null) {
            Competition c = findCompetition(competitionId);
            List<RankingDTO> result = assignRanks(
                    runningRecordRepository.getGroupRankingByCompetition(competitionId, c.getStartDate(), c.getEndDate()));
            mergeRankChange(result, "GROUP", competitionId);
            return result;
        }
        return assignRanks(runningRecordRepository.getGroupRanking());
    }

    public List<RankingDTO> getTeamRanking(Integer competitionId) {
        if (competitionId != null) {
            Competition c = findCompetition(competitionId);
            return assignRanks(
                    runningRecordRepository.getTeamRankingByCompetition(competitionId, c.getStartDate(), c.getEndDate()));
        }
        return assignRanks(runningRecordRepository.getTeamRanking());
    }

    // ── private ──────────────────────────────────────────────────────────────

    private List<RankingDTO> assignRanks(List<RankingDTO> list) {
        for (int i = 0; i < list.size(); i++) list.get(i).setRank(i + 1);
        return list;
    }

    /**
     * 직전 스냅샷과 현재 순위를 비교해 rankChange를 주입.
     * rankChange = previousRank - currentRank
     * 스냅샷 없으면 null (NEW) 유지.
     */
    private void mergeRankChange(List<RankingDTO> list, String entityType, Integer competitionId) {
        Map<Integer, Integer> prevRanks = rankSnapshotService.getLatestRanks(entityType, competitionId);
        list.forEach(dto -> {
            Integer prev = prevRanks.get(dto.getEntityId());
            if (prev != null) {
                dto.setRankChange(prev - dto.getRank());
            }
            // prev == null → rankChange 는 null 유지 (NEW)
        });
    }

    private Competition findCompetition(Integer competitionId) {
        return competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> {
                    log.warn("[RANKING-SVC] 대회 없음 - competitionId={}", competitionId);
                    return new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + competitionId + ")");
                });
    }
}
