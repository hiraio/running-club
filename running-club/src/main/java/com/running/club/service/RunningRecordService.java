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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RunningRecordService {

    private final RunningRecordRepository runningRecordRepository;
    private final RunningGroupRepository runningGroupRepository;
    private final TeamRepository teamRepository;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Transactional
    public void uploadRecord(Member member, Double distance, Integer duration,
                             LocalDate runningDate, String comment, MultipartFile file) throws Exception {

        log.info("[RECORD-SVC] 기록 업로드 시작 - memberId={}, distance={}km, duration={}s, runningDate={}",
                member.getId(), distance, duration, runningDate);

        // 1. 이미지 해시 추출 및 중복 체크
        String hash = FileUtil.getSHA256Hash(file);
        log.info("[RECORD-SVC] 사진 해시 생성 - hash={}", hash);
        if (runningRecordRepository.existsByPhotoHash(hash)) {
            log.warn("[RECORD-SVC] 중복 사진 감지 - memberId={}, hash={}", member.getId(), hash);
            throw new IllegalStateException("이미 업로드된 사진입니다. (중복 인증 방지)");
        }

        // 2. 물리적 한계 체크 (시속 45km 초과 시 거부)
        double speedKmh = distance / (duration / 3600.0);
        log.info("[RECORD-SVC] 속도 검증 - speedKmh={}", String.format("%.2f", speedKmh));
        if (speedKmh > 45.0) {
            log.warn("[RECORD-SVC] 비정상 속도 감지 - memberId={}, speedKmh={}", member.getId(), String.format("%.2f", speedKmh));
            throw new IllegalArgumentException("페이스가 비정상적으로 빠릅니다. (시속 " + String.format("%.2f", speedKmh) + "km/h)");
        }

        // 3. 소속 대회 도출
        Competition competition = null;
        if (member.getTeam() != null) {
            competition = teamRepository.findByTeamIdWithCompetition(member.getTeam().getId())
                    .map(Team::getCompetition)
                    .orElse(null);
        }
        log.info("[RECORD-SVC] 대회 도출 - competitionId={}", competition != null ? competition.getId() : "없음");

        // 4. 실제 디스크 저장
        String photoUrl = FileUtil.saveFile(file, uploadDir);
        log.info("[RECORD-SVC] 사진 저장 완료 - photoUrl={}", photoUrl);

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
        log.info("[RECORD-SVC] 기록 저장 완료 - memberId={}", member.getId());
    }

    public List<RunningRecordDTO> getMyRecords(Member member) {
        log.info("[RECORD-SVC] 내 기록 조회 - memberId={}", member.getId());
        List<RunningRecordDTO> result = runningRecordRepository.findByMember(member)
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
        log.info("[RECORD-SVC] 내 기록 조회 완료 - memberId={}, 건수={}", member.getId(), result.size());
        return result;
    }

    public List<RunningRecordDTO> getRecordsByTeamId(Integer teamId) {
        log.info("[RECORD-SVC] 팀 기록 조회 - teamId={}", teamId);
        List<RunningRecordDTO> result = runningRecordRepository.findByTeamId(teamId)
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
        log.info("[RECORD-SVC] 팀 기록 조회 완료 - teamId={}, 건수={}", teamId, result.size());
        return result;
    }

    public List<RunningRecordDTO> getRecordsByGroupId(Integer groupId) {
        log.info("[RECORD-SVC] 조 기록 조회 - groupId={}", groupId);
        runningGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> {
                    log.warn("[RECORD-SVC] 조 없음 - groupId={}", groupId);
                    return new IllegalArgumentException("존재하지 않는 조입니다. (id=" + groupId + ")");
                });

        List<RunningRecordDTO> result = runningRecordRepository.findByGroupId(groupId)
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
        log.info("[RECORD-SVC] 조 기록 조회 완료 - groupId={}, 건수={}", groupId, result.size());
        return result;
    }
}
