package com.running.club.service;

import com.running.club.domain.*;
import com.running.club.repository.CompetitionRepository;
import com.running.club.repository.RankSnapshotRepository;
import com.running.club.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

/**
 * 순위 스냅샷 저장 및 순위 변동(rankChange) 계산 서비스.
 *
 * <p>rankChange = previousRank - currentRank
 * <ul>
 *   <li>양수(+) → 순위 상승 ▲</li>
 *   <li>음수(-) → 순위 하락 ▼</li>
 *   <li>0    → 변동 없음 —</li>
 *   <li>null → 직전 스냅샷 없음 (NEW)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankSnapshotService {

    private final RankSnapshotRepository rankSnapshotRepository;
    private final RunningRecordRepository runningRecordRepository;
    private final CompetitionRepository   competitionRepository;

    // ── 조회 ─────────────────────────────────────────────────────────────────

    /**
     * 특정 대회+타입의 직전 순위 Map 반환.
     * entityId → previousRank (오늘 이전 가장 최근 스냅샷 기준).
     * 스냅샷이 없으면 Map에 포함하지 않음 → rankChange = null (NEW).
     */
    public Map<Integer, Integer> getLatestRanks(String entityType, Integer competitionId) {
        List<RankSnapshot> snapshots = rankSnapshotRepository
                .findLatestBeforeToday(entityType, competitionId, LocalDate.now());

        // ORDER BY snapshotDate DESC → putIfAbsent = 가장 최근 스냅샷만 유지
        Map<Integer, Integer> result = new LinkedHashMap<>();
        for (RankSnapshot s : snapshots) {
            result.putIfAbsent(s.getEntityId(), s.getRank());
        }
        return result;
    }

    // ── 스냅샷 저장 ───────────────────────────────────────────────────────────

    /**
     * PROCEEDING 상태의 모든 대회에 대해 오늘 날짜 스냅샷을 저장.
     * 이미 오늘 스냅샷이 있으면 삭제 후 재생성(멱등성 보장).
     * 스케줄러 + 서버 기동 시 1회 호출.
     */
    @Transactional
    public void saveSnapshot() {
        LocalDate today = LocalDate.now();
        log.info("[SNAPSHOT] 순위 스냅샷 저장 시작 - date={}", today);

        List<Competition> active = competitionRepository.findAll().stream()
                .filter(c -> CompetitionStatus.of(c.getStartDate(), c.getEndDate(), c.getIsActive())
                        == CompetitionStatus.PROCEEDING)
                .toList();

        if (active.isEmpty()) {
            log.info("[SNAPSHOT] 진행 중인 대회 없음 — 스냅샷 건너뜀");
            return;
        }

        for (Competition comp : active) {
            saveEntitySnapshot("MEMBER", comp, today);
            saveEntitySnapshot("GROUP",  comp, today);
        }

        log.info("[SNAPSHOT] 순위 스냅샷 저장 완료 - 대회 수={}", active.size());
    }

    // ── private ───────────────────────────────────────────────────────────────

    private void saveEntitySnapshot(String type, Competition comp, LocalDate today) {
        // 오늘 스냅샷 삭제 (재실행 멱등성)
        rankSnapshotRepository.deleteByTypeAndCompetitionAndDate(type, comp.getId(), today);

        List<RankingDTO> rankings = "MEMBER".equals(type)
                ? assignRanks(runningRecordRepository.getMemberRankingByCompetition(comp.getId()))
                : assignRanks(runningRecordRepository.getGroupRankingByCompetition(comp.getId(), comp.getStartDate(), comp.getEndDate()));

        if (rankings.isEmpty()) {
            log.info("[SNAPSHOT] {} 스냅샷 저장 건너뜀 (기록 없음) - competitionId={}", type, comp.getId());
            return;
        }

        List<RankSnapshot> snapshots = rankings.stream()
                .map(dto -> RankSnapshot.builder()
                        .entityType(type)
                        .entityId(dto.getEntityId())
                        .competition(comp)
                        .rank(dto.getRank())
                        .snapshotDate(today)
                        .build())
                .toList();

        rankSnapshotRepository.saveAll(snapshots);
        log.info("[SNAPSHOT] {} 스냅샷 저장 완료 - competitionId={}, 건수={}", type, comp.getId(), snapshots.size());
    }

    private List<RankingDTO> assignRanks(List<RankingDTO> list) {
        for (int i = 0; i < list.size(); i++) list.get(i).setRank(i + 1);
        return list;
    }
}
