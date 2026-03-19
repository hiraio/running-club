package com.running.club.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.Competition;
import com.running.club.domain.CompetitionCreateRequest;
import com.running.club.domain.CompetitionResponse;
import com.running.club.domain.CompetitionSummaryDTO;
import com.running.club.domain.CompetitionUpdateRequest;
import com.running.club.repository.CompetitionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminCompetitionService {

    private final CompetitionRepository competitionRepository;

    // 전체 목록 조회 (팀 수 포함)
    @Transactional(readOnly = true)
    public List<CompetitionSummaryDTO> getAll() {
        return competitionRepository.findAllWithTeamCount();
    }

    // 대회 생성
    @Transactional
    public CompetitionResponse create(CompetitionCreateRequest request) {
        log.info("[COMPETITION-SVC] 대회 생성 - title={}, startDate={}, endDate={}",
                request.getTitle(), request.getStartDate(), request.getEndDate());
        validateDates(request.getStartDate(), request.getEndDate());

        Competition competition = Competition.builder()
                .title(request.getTitle())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        CompetitionResponse result = CompetitionResponse.from(competitionRepository.save(competition));
        log.info("[COMPETITION-SVC] 대회 생성 완료 - id={}", result.getId());
        return result;
    }

    // 대회 수정 (제목, 기간, 활성화 여부) — PATCH: null 필드는 기존 값 유지
    @Transactional
    public CompetitionResponse update(Integer id, CompetitionUpdateRequest request) {
        log.info("[COMPETITION-SVC] 대회 수정 - id={}", id);
        Competition competition = competitionRepository.findByCompetitionId(id)
                .orElseThrow(() -> {
                    log.warn("[COMPETITION-SVC] 대회 없음 - id={}", id);
                    return new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + id + ")");
                });

        LocalDate effectiveStart = request.getStartDate() != null ? request.getStartDate() : competition.getStartDate();
        LocalDate effectiveEnd   = request.getEndDate()   != null ? request.getEndDate()   : competition.getEndDate();
        if (request.getStartDate() != null || request.getEndDate() != null) {
            validateDates(effectiveStart, effectiveEnd);
        }

        competition.update(request.getTitle(), request.getStartDate(), request.getEndDate(), request.getIsActive());
        log.info("[COMPETITION-SVC] 대회 수정 완료 - id={}", id);
        return CompetitionResponse.from(competition);
    }

    // 대회 삭제 (소속 팀 존재 시 삭제 불가)
    @Transactional
    public void delete(Integer id) {
        log.info("[COMPETITION-SVC] 대회 삭제 시도 - id={}", id);
        competitionRepository.findByCompetitionId(id)
                .orElseThrow(() -> {
                    log.warn("[COMPETITION-SVC] 대회 없음 - id={}", id);
                    return new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + id + ")");
                });

        long teamCount = competitionRepository.countTeamsByCompetitionId(id);
        if (teamCount > 0) {
            log.warn("[COMPETITION-SVC] 대회 삭제 불가 - id={}, 소속 팀 수={}", id, teamCount);
            throw new IllegalStateException(
                    "소속 팀이 존재하는 대회는 삭제할 수 없습니다. 팀을 먼저 삭제하세요. (팀 수: " + teamCount + ")");
        }
        competitionRepository.deleteById(id);
        log.info("[COMPETITION-SVC] 대회 삭제 완료 - id={}", id);
    }

    // 시작일 < 종료일 검증
    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("시작일과 종료일은 필수입니다.");
        }
        if (!startDate.isBefore(endDate)) {
            throw new IllegalArgumentException("종료일은 시작일보다 이후여야 합니다.");
        }
    }
}
