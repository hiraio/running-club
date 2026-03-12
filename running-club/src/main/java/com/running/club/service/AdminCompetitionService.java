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
        validateDates(request.getStartDate(), request.getEndDate());

        Competition competition = Competition.builder()
                .title(request.getTitle())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        return CompetitionResponse.from(competitionRepository.save(competition));
    }

    // 대회 수정 (제목, 기간, 활성화 여부)
    @Transactional
    public CompetitionResponse update(Integer id, CompetitionUpdateRequest request) {
        Competition competition = competitionRepository.findByCompetitionId(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대회입니다. (id=" + id + ")"));

        validateDates(request.getStartDate(), request.getEndDate());
        competition.update(request.getTitle(), request.getStartDate(), request.getEndDate(), request.getIsActive());

        // @Transactional 더티 체킹으로 자동 반영 - 별도 save 불필요
        return CompetitionResponse.from(competition);
    }

    // 대회 삭제 (소속 팀 존재 시 삭제 불가)
    @Transactional
    public void delete(Integer id) {
        long teamCount = competitionRepository.countTeamsByCompetitionId(id);
        if (teamCount > 0) {
            throw new IllegalStateException(
                    "소속 팀이 존재하는 대회는 삭제할 수 없습니다. 팀을 먼저 삭제하세요. (팀 수: " + teamCount + ")");
        }
        competitionRepository.deleteById(id);
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
