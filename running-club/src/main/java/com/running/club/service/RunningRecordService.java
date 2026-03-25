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

    // 운영 환경에서 사진 URL에 도메인 prefix 추가 (로컬은 빈 값 → 상대경로 유지)
    @Value("${server.base-url:}")
    private String serverBaseUrl;

    @Transactional
    public void uploadRecord(Member member, Double distance, Integer duration,
                             LocalDate runningDate, String comment, MultipartFile file) throws Exception {

        // 1. 이미지 해시 추출 및 중복 체크
        String hash = FileUtil.getSHA256Hash(file);
        if (runningRecordRepository.existsByPhotoHash(hash)) {
            log.warn("[RECORD] 중복 사진 거부 - memberId={}", member.getId());
            throw new IllegalStateException("이미 업로드된 사진입니다. (중복 인증 방지)");
        }

        // 2. 물리적 한계 체크 (시속 45km 초과 시 거부)
        double speedKmh = distance / (duration / 3600.0);
        if (speedKmh > 45.0) {
            log.warn("[RECORD] 비정상 속도 거부 - memberId={}, speedKmh={:.2f}", member.getId(), speedKmh);
            throw new IllegalArgumentException("페이스가 비정상적으로 빠릅니다. (시속 " + String.format("%.2f", speedKmh) + "km/h)");
        }

        // 3. 소속 대회 도출
        Competition competition = null;
        if (member.getTeam() != null) {
            competition = teamRepository.findByTeamIdWithCompetition(member.getTeam().getId())
                    .map(Team::getCompetition)
                    .orElse(null);
        }

        // 4. 실제 디스크 저장
        String relativeUrl = FileUtil.saveFile(file, uploadDir);
        String photoUrl = (serverBaseUrl == null || serverBaseUrl.isBlank())
                ? relativeUrl
                : serverBaseUrl + relativeUrl;

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
        log.info("[RECORD] 업로드 - memberId={}, distance={}km, competitionId={}",
                member.getId(), distance, competition != null ? competition.getId() : "없음");
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
     * 활동 피드 조회.
     * - records    : 최신 APPROVED 기록 최대 10건
     * - dailyKing  : 오늘 누적 거리 1위 (데이터 없으면 null)
     * - risingStar : 이번 주 vs 지난 주 성장률 1위 (양쪽 기록 있는 멤버만 대상, 없으면 null)
     */
    public RecentFeedResponse getRecentFeed() {

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
                        .createdAt(r.getVerifiedAt() != null ? r.getVerifiedAt() : r.getCreatedAt())
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
        double maxGrowth = 0;

        for (Object[] row : thisWeekRows) {
            Integer memberId  = ((Number) row[0]).intValue();
            double  thisKm    = ((Number) row[4]).doubleValue();
            Double  lastKm    = lastWeekMap.get(memberId);

            // 지난 주 기록이 없거나 0이면 성장률 계산 불가 → 제외
            if (lastKm == null || lastKm <= 0) continue;

            double growth = (thisKm - lastKm) / lastKm * 100.0;
            // 양수 성장률만 표시 (이번 주가 지난 주보다 높은 사람만)
            if (growth > maxGrowth) {
                maxGrowth  = growth;
                risingStar = RecentFeedResponse.FeedHighlight.builder()
                        .userName((String) row[1])
                        .teamName(row[2] != null ? (String) row[2] : null)
                        .teamColorCode(row[3] != null ? (String) row[3] : null)
                        .value((double) Math.round(growth)) // 정수
                        .build();
            }
        }


        return RecentFeedResponse.builder()
                .records(feedItems)
                .dailyKing(dailyKing)
                .risingStar(risingStar)
                .build();
    }

    public List<RunningRecordDTO> getRecordsByGroupId(Integer groupId) {
        runningGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 조입니다. (id=" + groupId + ")"));
        return runningRecordRepository.findByGroupId(groupId)
                .stream()
                .map(RunningRecordDTO::from)
                .collect(Collectors.toList());
    }
}
