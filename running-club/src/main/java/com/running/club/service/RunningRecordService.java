package com.running.club.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.running.club.domain.Competition;
import com.running.club.domain.Member;
import com.running.club.domain.RunningRecord;
import com.running.club.domain.RunningRecordDTO;
import com.running.club.domain.Team;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.repository.RunningRecordRepository;
import com.running.club.repository.TeamRepository;
import com.running.club.util.FileUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RunningRecordService {

    private final RunningRecordRepository runningRecordRepository;
    private final RunningGroupRepository runningGroupRepository;
    private final TeamRepository teamRepository;

    @Value("${file.upload.dir}")
    private String uploadDir;

    /**
     * 기록 + 사진 업로드.
     *
     * <p>competition 자동 도출: member.team.competition 경로로 추적.
     * member는 Spring Security 세션 캐시 엔티티(detached 가능)이므로
     * team 프록시의 ID만 꺼내 DB에서 JOIN FETCH로 재조회 — LazyInitializationException 방지.
     */
    @Transactional
    public void uploadRecord(Member member, Double distance, Integer duration,
                             LocalDate runningDate, String comment, MultipartFile file) throws Exception {

        // 1. 이미지 해시 추출 및 중복 체크
        String hash = FileUtil.getSHA256Hash(file);
        if (runningRecordRepository.existsByPhotoHash(hash)) {
            throw new IllegalStateException("이미 업로드된 사진입니다. (중복 인증 방지)");
        }

        // 2. 물리적 한계 체크 (시속 45km 초과 시 거부)
        double speedKmh = distance / (duration / 3600.0);
        if (speedKmh > 45.0) {
            throw new IllegalArgumentException("페이스가 비정상적으로 빠릅니다. (시속 " + String.format("%.2f", speedKmh) + "km/h)");
        }

        // 3. 소속 대회 도출 (competition_id 세팅)
        // member.getTeam()은 Hibernate 프록시 — .getId()는 프록시 초기화 없이 반환되므로 안전
        // findByTeamIdWithCompetition: Team + Competition JOIN FETCH (단일 쿼리)
        Competition competition = null;
        if (member.getTeam() != null) {
            competition = teamRepository.findByTeamIdWithCompetition(member.getTeam().getId())
                    .map(Team::getCompetition)
                    .orElse(null);
        }

        // 4. 실제 디스크 저장 후 URL 경로 반환
        String photoUrl = FileUtil.saveFile(file, uploadDir);

        RunningRecord record = RunningRecord.builder()
                .member(member)
                .competition(competition)
                .distance(distance)
                .duration(duration)
                .runningDate(runningDate)
                .comment(comment)
                .photoUrl(photoUrl)
                .photoHash(hash)
                .build();

        runningRecordRepository.save(record);
    }

    public List<RunningRecordDTO> getMyRecords(Member member) {
        return runningRecordRepository.findByMember(member)
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
    }

    public List<RunningRecordDTO> getRecordsByTeamId(Integer teamId) {
        return runningRecordRepository.findByTeamId(teamId)
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * 조별 기록 조회.
     *
     * <p>groupId 존재 여부를 먼저 검증 — 존재하지 않는 groupId면 IllegalArgumentException(→ 400).
     * 빈 기록 목록은 정상 응답 (조는 존재하지만 기록이 없는 상태).
     */
    public List<RunningRecordDTO> getRecordsByGroupId(Integer groupId) {
        runningGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 조입니다. (id=" + groupId + ")"));

        return runningRecordRepository.findByGroupId(groupId)
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
    }
}
