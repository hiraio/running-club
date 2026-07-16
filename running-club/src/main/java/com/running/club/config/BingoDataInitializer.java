package com.running.club.config;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.running.club.domain.BingoBoard;
import com.running.club.domain.BingoMission;
import com.running.club.domain.BingoSubmission;
import com.running.club.domain.BingoSubmissionStatus;
import com.running.club.domain.Member;
import com.running.club.domain.RunningGroup;
import com.running.club.repository.BingoBoardRepository;
import com.running.club.repository.BingoMissionRepository;
import com.running.club.repository.BingoSubmissionRepository;
import com.running.club.repository.MemberRepository;
import com.running.club.repository.RunningGroupRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 로컬 전용 빙고 테스트 데이터 초기화.
 * bingoPhoto/ 폴더의 PPT 사진 기반 — 실제 운영 데이터와 동일한 달성 현황.
 */
@Slf4j
@Component
@Profile("!prod")
@RequiredArgsConstructor
public class BingoDataInitializer implements ApplicationRunner {

    private final BingoBoardRepository boardRepo;
    private final BingoMissionRepository missionRepo;
    private final BingoSubmissionRepository submissionRepo;
    private final RunningGroupRepository groupRepo;
    private final MemberRepository memberRepo;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (boardRepo.count() > 0) {
            log.info("[BingoInit] 빙고 데이터 이미 존재 — 스킵");
            return;
        }

        // 그룹이 없으면 빙고 submission을 만들 수 없음
        List<RunningGroup> groups = groupRepo.findAll();
        if (groups.isEmpty()) {
            log.warn("[BingoInit] running_groups 없음 — 빙고판+미션만 생성 (submission 스킵)");
        }

        // ── 1. 빙고판 생성 ──
        BingoBoard board = boardRepo.save(BingoBoard.builder()
                .title("2026 1학기 ND 빙고 챌린지")
                .size(3)
                .startDate(LocalDate.of(2026, 3, 10))
                .endDate(LocalDate.of(2026, 6, 20))
                .build());
        log.info("[BingoInit] 빙고판 생성: {}", board.getTitle());

        // ── 2. 미션 9개 생성 ──
        String[][] missionData = {
                {"인스타 맞팔하기",              "조원모두"},
                {"마라톤 참여하기",              "3명 이상"},
                {"러닝 기록 앱 설치하기",        "조원모두 ex)NikeRunClub"},
                {"한강에서 러닝하기",            "3명이상 3km이상"},
                {"조별 단톡방 만들고 자기소개하기", ""},
                {"술 or 밥 먹기",               "3명 이상"},
                {"조원 전체 합산 15km 달리기",    "누적 km × 당일"},
                {"3km 4:30 페이스 이내 완주",    "1명 이상"},
                {"트랙에서 러닝하기",            "학숙 위 3km이상 3명이상"},
        };

        BingoMission[] missions = new BingoMission[9];
        for (int i = 0; i < 9; i++) {
            missions[i] = missionRepo.save(BingoMission.builder()
                    .board(board)
                    .position(i)
                    .title(missionData[i][0])
                    .description(missionData[i][1].isEmpty() ? null : missionData[i][1])
                    .build());
        }
        log.info("[BingoInit] 빙고 미션 9개 생성 완료");

        if (groups.isEmpty()) return;

        // ── 3. 조별 달성 현황 (bingoPhoto/ PPT 기반) ──
        // key = groupName의 숫자 부분 (1~8), value = 승인된 position 목록
        Map<Integer, int[]> completions = Map.of(
                1, new int[]{0, 2, 3, 4},
                2, new int[]{0, 2, 4},
                3, new int[]{0, 2, 3, 4},
                4, new int[]{0, 2, 4, 6},
                5, new int[]{0, 2, 4, 5},
                6, new int[]{0, 2, 4, 6},
                7, new int[]{0, 1, 2, 3, 4, 5, 6, 7, 8},
                8, new int[]{0, 2, 4, 6}
        );

        // 관리자(승인자) — 아무 멤버나 하나 사용
        Member admin = memberRepo.findAll().stream()
                .filter(m -> "ADMIN".equals(m.getRole()))
                .findFirst()
                .orElse(memberRepo.findAll().get(0));

        int submissionCount = 0;
        for (RunningGroup group : groups) {
            // 그룹 이름에서 숫자 추출 (예: "1조" → 1)
            int groupNum = extractGroupNumber(group.getGroupName());
            if (groupNum == 0 || !completions.containsKey(groupNum)) continue;

            // 이 조에 속한 멤버 하나 찾기 (제출자용)
            Member submitter = memberRepo.findAll().stream()
                    .filter(m -> m.getRunningGroup() != null
                            && m.getRunningGroup().getId().equals(group.getId()))
                    .findFirst()
                    .orElse(admin);

            for (int pos : completions.get(groupNum)) {
                submissionRepo.save(BingoSubmission.builder()
                        .mission(missions[pos])
                        .group(group)
                        .status(BingoSubmissionStatus.APPROVED)
                        .submittedBy(submitter)
                        .submittedAt(LocalDateTime.now().minusDays(groupNum))
                        .verifiedBy(admin)
                        .verifiedAt(LocalDateTime.now().minusDays(groupNum).plusHours(1))
                        .photoUrls(List.of("/photos/bingo/sample.jpg"))
                        .build());
                submissionCount++;
            }
        }
        log.info("[BingoInit] 빙고 제출 {}건 생성 완료", submissionCount);
    }

    private int extractGroupNumber(String groupName) {
        try {
            return Integer.parseInt(groupName.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
