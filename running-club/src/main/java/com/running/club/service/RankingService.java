package com.running.club.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final CompetitionRepository competitionRepository;

    public List<RankingDTO> getTeamRanking(Integer competitionId) {
        log.info("[RANKING-SVC] 팀 랭킹 조회 - competitionId={}", competitionId);
        List<RankingDTO> result;
        if (competitionId != null) {
            validateCompetitionExists(competitionId);
            result = assignRanks(runningRecordRepository.getTeamRankingByCompetition(competitionId));
        } else {
            result = assignRanks(runningRecordRepository.getTeamRanking());
        }
        log.info("[RANKING-SVC] 팀 랭킹 조회 완료 - 건수={}", result.size());
        return result;
    }

    public List<RankingDTO> getGroupRanking(Integer competitionId) {
        log.info("[RANKING-SVC] 조 랭킹 조회 - competitionId={}", competitionId);
        List<RankingDTO> result;
        if (competitionId != null) {
            validateCompetitionExists(competitionId);
            result = assignRanks(runningRecordRepository.getGroupRankingByCompetition(competitionId));
        } else {
            result = assignRanks(runningRecordRepository.getGroupRanking());
        }
        log.info("[RANKING-SVC] 조 랭킹 조회 완료 - 건수={}", result.size());
        return result;
    }

    public List<RankingDTO> getMemberRanking(Integer competitionId) {
        log.info("[RANKING-SVC] 개인 랭킹 조회 - competitionId={}", competitionId);
        List<RankingDTO> result;
        if (competitionId != null) {
            validateCompetitionExists(competitionId);
            result = assignRanks(runningRecordRepository.getMemberRankingByCompetition(competitionId));
        } else {
            result = assignRanks(runningRecordRepository.getMemberRanking());
        }
        log.info("[RANKING-SVC] 개인 랭킹 조회 완료 - 건수={}", result.size());
        return result;
    }

    // ── private ──────────────────────────────────────────────────────────────

    private List<RankingDTO> assignRanks(List<RankingDTO> list) {
        for (int i = 0; i < list.size(); i++) {
            list.get(i).setRank(i + 1);
        }
        return list;
    }

    private void validateCompetitionExists(Integer competitionId) {
        competitionRepository.findByCompetitionId(competitionId)
                .orElseThrow(() -> {
                    log.warn("[RANKING-SVC] 대회 없음 - competitionId={}", competitionId);
                    return new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + competitionId + ")");
                });
    }
}
