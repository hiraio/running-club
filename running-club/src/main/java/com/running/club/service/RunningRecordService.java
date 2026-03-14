package com.running.club.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.running.club.domain.Competition;
import com.running.club.domain.Member;
import com.running.club.domain.RecentFeedResponse;
import com.running.club.domain.RunningRecord;
import com.running.club.domain.RunningRecordDTO;
import com.running.club.domain.Team;
import com.running.club.domain.TodayMvpDTO;
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

    /**
     * 활동 피드 조회.
     * - records    : 최신 APPROVED 기록 최대 10건
     * - dailyKing  : 오늘 누적 거리 1위 (데이터 없으면 null)
     * - risingStar : 이번 주 vs 지난 주 성장률 1위 (양쪽 기록 있는 멤버만 대상, 없으면 null)
     */
    public RecentFeedResponse getRecentFeed() {
        log.info("[RECORD-SVC] 활동 피드 조회 시작");

        // 1. 최신 피드 (최대 10건)
        List<RunningRecord> latest = runningRecordRepository
                .findLatestApproved(org.springframework.data.domain.PageRequest.of(0, 10));

        List<RecentFeedResponse.FeedItem> feedItems = latest.stream()
                .map(r -> RecentFeedResponse.FeedItem.builder()
                        .id(r.getId())
                        .userName(r.getMember().getName())
                        .teamName(r.getMember().getTeam() != null ? r.getMember().getTeam().getTeamName() : null)
                        .teamColorCode(r.getMember().getTeam() != null ? r.getMember().getTeam().getColorCode() : null)
                        .groupName(r.getMember().getRunningGroup() != null ? r.getMember().getRunningGroup().getGroupName() : null)
                        .distance(r.getDistance())
                        .duration(r.getDuration())
                        .runningDate(r.getRunningDate().toString())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        // 2. Daily King (오늘 누적 거리 1위, 대회 무관)
        LocalDate today = LocalDate.now();
        List<TodayMvpDTO> kingList = runningRecordRepository
                .findDailyKingAll(today, org.springframework.data.domain.PageRequest.of(0, 1));

        RecentFeedResponse.FeedHighlight dailyKing = kingList.isEmpty() ? null
                : RecentFeedResponse.FeedHighlight.builder()
                        .userName(kingList.get(0).getName())
                        .teamName(kingList.get(0).getTeamName())
                        .teamColorCode(kingList.get(0).getTeamColorCode())
                        .value(kingList.get(0).getTodayKm())
                        .build();

        // 3. Rising Star (이번 주 vs 지난 주 성장률 1위)
        LocalDate thisMonday  = today.with(DayOfWeek.MONDAY);
        LocalDate lastMonday  = thisMonday.minusWeeks(1);
        LocalDate lastSunday  = thisMonday.minusDays(1);

        List<Object[]> thisWeekRows = runningRecordRepository.findWeeklyDistancePerMember(thisMonday, today);
        List<Object[]> lastWeekRows = runningRecordRepository.findWeeklyDistancePerMember(lastMonday, lastSunday);

        // lastWeek map: memberId → km
        Map<Integer, Double> lastWeekMap = new HashMap<>();
        for (Object[] row : lastWeekRows) {
            Integer memberId = ((Number) row[0]).intValue();
            double  km       = ((Number) row[4]).doubleValue();
            lastWeekMap.put(memberId, km);
        }

        RecentFeedResponse.FeedHighlight risingStar = null;
        double maxGrowth = Double.NEGATIVE_INFINITY;

        for (Object[] row : thisWeekRows) {
            Integer memberId  = ((Number) row[0]).intValue();
            double  thisKm    = ((Number) row[4]).doubleValue();
            Double  lastKm    = lastWeekMap.get(memberId);

            // 지난 주 기록이 없거나 0이면 성장률 계산 불가 → 제외
            if (lastKm == null || lastKm <= 0) continue;

            double growth = (thisKm - lastKm) / lastKm * 100.0;
            if (growth > maxGrowth) {
                maxGrowth  = growth;
                risingStar = RecentFeedResponse.FeedHighlight.builder()
                        .userName((String) row[1])
                        .teamName(row[2] != null ? (String) row[2] : null)
                        .teamColorCode(row[3] != null ? (String) row[3] : null)
                        .value(Math.round(growth * 10.0) / 10.0) // 소수점 1자리
                        .build();
            }
        }

        log.info("[RECORD-SVC] 활동 피드 조회 완료 - 피드{}건, dailyKing={}, risingStar={}",
                feedItems.size(),
                dailyKing != null ? dailyKing.getUserName() : "없음",
                risingStar != null ? risingStar.getUserName() : "없음");

        return RecentFeedResponse.builder()
                .records(feedItems)
                .dailyKing(dailyKing)
                .risingStar(risingStar)
                .build();
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
