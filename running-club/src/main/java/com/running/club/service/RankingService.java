package com.running.club.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.RankingDTO;
import com.running.club.repository.RunningRecordRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankingService {

    private final RunningRecordRepository runningRecordRepository;

    public List<RankingDTO> getTeamRanking() {
        return assignRanks(runningRecordRepository.getTeamRanking());
    }

    public List<RankingDTO> getGroupRanking() {
        return assignRanks(runningRecordRepository.getGroupRanking());
    }

    public List<RankingDTO> getMemberRanking() {
        return assignRanks(runningRecordRepository.getMemberRanking());
    }

    // 이미 거리 내림차순으로 정렬된 리스트에 1위부터 순위 부여
    private List<RankingDTO> assignRanks(List<RankingDTO> list) {
        for (int i = 0; i < list.size(); i++) {
            list.get(i).setRank(i + 1);
        }
        return list;
    }
}
