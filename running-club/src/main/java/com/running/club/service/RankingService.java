package com.running.club.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.RankingDTO;
import com.running.club.repository.CompetitionRepository;
import com.running.club.repository.RunningRecordRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankingService {

    private final RunningRecordRepository runningRecordRepository;
    private final CompetitionRepository competitionRepository;

    /**
     * 팀 랭킹.
     *
     * @param competitionId null이면 전체 집계, 값이 있으면 해당 대회 기준 필터.
     *                      존재하지 않는 competitionId → IllegalArgumentException (400).
     */
    public List<RankingDTO> getTeamRanking(Integer competitionId) {
        if (competitionId != null) {
            validateCompetitionExists(competitionId);
            return assignRanks(runningRecordRepository.getTeamRankingByCompetition(competitionId));
        }
        return assignRanks(runningRecordRepository.getTeamRanking());
    }

    /**
     * 조 랭킹.
     *
     * @param competitionId null이면 전체, 값이 있으면 대회 기준 필터.
     */
    public List<RankingDTO> getGroupRanking(Integer competitionId) {
        if (competitionId != null) {
            validateCompetitionExists(competitionId);
            return assignRanks(runningRecordRepository.getGroupRankingByCompetition(competitionId));
        }
        return assignRanks(runningRecordRepository.getGroupRanking());
    }

    /**
     * 개인 랭킹.
     *
     * @param competitionId null이면 전체, 값이 있으면 대회 기준 필터.
     */
    public List<RankingDTO> getMemberRanking(Integer competitionId) {
        if (competitionId != null) {
            validateCompetitionExists(competitionId);
            return assignRanks(runningRecordRepository.getMemberRankingByCompetition(competitionId));
        }
        return assignRanks(runningRecordRepository.getMemberRanking());
    }

    // ── private ──────────────────────────────────────────────────────────────

    /** 이미 거리 내림차순으로 정렬된 리스트에 1위부터 순위 부여 */
    private List<RankingDTO> assignRanks(List<RankingDTO> list) {
        for (int i = 0; i < list.size(); i++) {
            list.get(i).setRank(i + 1);
        }
        return list;
    }

    /**
     * 대회 존재 여부 검증.
     * 존재하지 않는 competitionId → IllegalArgumentException → GlobalExceptionHandler → 400.
     */
    private void validateCompetitionExists(Integer competitionId) {
        competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 대회입니다. (id=" + competitionId + ")"));
    }
}
