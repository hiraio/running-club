package com.running.club.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.running.club.domain.BingoBoard;
import com.running.club.dto.bingo.BingoBoardResponse;
import com.running.club.domain.BingoMission;
import com.running.club.domain.BingoSubmission;
import com.running.club.domain.BingoSubmissionStatus;
import com.running.club.domain.Member;
import com.running.club.repository.BingoBoardRepository;
import com.running.club.repository.BingoMissionRepository;
import com.running.club.repository.BingoSubmissionRepository;
import com.running.club.repository.MemberRepository;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.util.FileUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BingoService {

    private final BingoBoardRepository boardRepo;
    private final BingoMissionRepository missionRepo;
    private final BingoSubmissionRepository submissionRepo;
    private final RunningGroupRepository groupRepo;
    private final MemberRepository memberRepo;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${server.base-url:}")
    private String serverBaseUrl;

    // ── 관리자: 빙고판 생성 ────────────────────────────────────────

    @Transactional
    public BingoBoardResponse createBoard(String title, java.time.LocalDate startDate,
                                           java.time.LocalDate endDate, List<MissionInput> missions) {
        if (missions == null || missions.size() != 9) {
            throw new IllegalArgumentException("미션은 정확히 9개여야 합니다.");
        }

        BingoBoard board = boardRepo.save(BingoBoard.builder()
                .title(title)
                .size(3)
                .startDate(startDate)
                .endDate(endDate)
                .build());

        List<BingoBoardResponse.MissionDTO> missionDTOs = new ArrayList<>();
        for (MissionInput mi : missions) {
            BingoMission mission = missionRepo.save(BingoMission.builder()
                    .board(board)
                    .position(mi.position())
                    .title(mi.title())
                    .description(mi.description())
                    .build());
            missionDTOs.add(BingoBoardResponse.MissionDTO.from(mission));
        }

        log.info("[BINGO] 빙고판 생성 - boardId={}, title={}", board.getId(), title);

        return BingoBoardResponse.builder()
                .boardId(board.getId())
                .title(board.getTitle())
                .size(board.getSize())
                .startDate(board.getStartDate())
                .endDate(board.getEndDate())
                .missions(missionDTOs)
                .submissions(List.of())
                .build();
    }

    public record MissionInput(int position, String title, String description) {}

    // ── 공개: 빙고판 + 미션 + 전체 제출 현황 ──────────────────────

    public BingoBoardResponse getBoard() {
        BingoBoard board = boardRepo.findFirstByOrderByCreatedAtDesc()
                .orElseThrow(() -> new IllegalArgumentException("활성 빙고판이 없습니다."));

        List<BingoMission> missions = missionRepo.findByBoardId(board.getId());
        List<BingoSubmission> submissions = submissionRepo.findByBoardId(board.getId());

        List<BingoBoardResponse.GroupDTO> groupDTOs = groupRepo.findAll().stream()
                .map(g -> BingoBoardResponse.GroupDTO.builder()
                        .groupId(g.getId())
                        .groupName(g.getGroupName())
                        .build())
                .collect(Collectors.toList());

        return BingoBoardResponse.builder()
                .boardId(board.getId())
                .title(board.getTitle())
                .size(board.getSize())
                .startDate(board.getStartDate())
                .endDate(board.getEndDate())
                .missions(missions.stream()
                        .map(BingoBoardResponse.MissionDTO::from)
                        .collect(Collectors.toList()))
                .submissions(submissions.stream()
                        .map(BingoBoardResponse.SubmissionDTO::from)
                        .collect(Collectors.toList()))
                .groups(groupDTOs)
                .build();
    }

    // ── 인증: 미션 인증 제출 ──────────────────────────────────────

    @Transactional
    public void submit(Member member, Integer missionId, List<MultipartFile> files) throws Exception {
        if (member.getRunningGroup() == null) {
            throw new IllegalStateException("조가 배정되지 않은 회원은 빙고 인증을 제출할 수 없습니다.");
        }

        BingoMission mission = missionRepo.findById(missionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 미션입니다."));

        Integer groupId = member.getRunningGroup().getId();

        // 기존 제출 확인
        var existing = submissionRepo.findByMissionIdAndGroupId(missionId, groupId);

        if (existing.isPresent()) {
            BingoSubmission sub = existing.get();
            if (sub.getStatus() == BingoSubmissionStatus.APPROVED) {
                throw new IllegalStateException("이미 승인된 미션입니다.");
            }
            if (sub.getStatus() == BingoSubmissionStatus.PENDING) {
                throw new IllegalStateException("이미 심사 대기중인 미션입니다.");
            }
            // REJECTED → 재제출
            List<String> photoUrls = savePhotos(files);
            sub.resubmit(member, photoUrls);
            log.info("[BINGO] 재제출 - memberId={}, missionId={}, groupId={}", member.getId(), missionId, groupId);
            return;
        }

        // 신규 제출
        List<String> photoUrls = savePhotos(files);
        submissionRepo.save(BingoSubmission.builder()
                .mission(mission)
                .group(member.getRunningGroup())
                .submittedBy(member)
                .photoUrls(photoUrls)
                .build());
        log.info("[BINGO] 제출 - memberId={}, missionId={}, groupId={}", member.getId(), missionId, groupId);
    }

    // ── 관리자: 대기 목록 ─────────────────────────────────────────

    public List<BingoBoardResponse.SubmissionDTO> getPendingSubmissions() {
        BingoBoard board = boardRepo.findFirstByOrderByCreatedAtDesc()
                .orElseThrow(() -> new IllegalArgumentException("활성 빙고판이 없습니다."));

        return submissionRepo.findByBoardIdAndStatus(board.getId(), BingoSubmissionStatus.PENDING)
                .stream()
                .map(BingoBoardResponse.SubmissionDTO::from)
                .collect(Collectors.toList());
    }

    // ── 관리자: 승인 ──────────────────────────────────────────────

    @Transactional
    public void approve(Integer submissionId, Member admin) {
        BingoSubmission sub = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 제출입니다."));

        if (sub.getStatus() != BingoSubmissionStatus.PENDING) {
            throw new IllegalStateException("대기 상태가 아닌 제출은 승인할 수 없습니다.");
        }

        sub.approve(admin);
        log.info("[BINGO] 승인 - submissionId={}, adminId={}", submissionId, admin.getId());
    }

    // ── 관리자: 반려 ──────────────────────────────────────────────

    @Transactional
    public void reject(Integer submissionId, String reason, Member admin) {
        BingoSubmission sub = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 제출입니다."));

        if (sub.getStatus() != BingoSubmissionStatus.PENDING) {
            throw new IllegalStateException("대기 상태가 아닌 제출은 반려할 수 없습니다.");
        }

        sub.reject(admin, reason);
        log.info("[BINGO] 반려 - submissionId={}, adminId={}, reason={}", submissionId, admin.getId(), reason);
    }

    // ── 내부: 사진 저장 ───────────────────────────────────────────

    private List<String> savePhotos(List<MultipartFile> files) throws Exception {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("인증 사진을 1장 이상 첨부해주세요.");
        }
        if (files.size() > 5) {
            throw new IllegalArgumentException("사진은 최대 5장까지 첨부 가능합니다.");
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            String relativeUrl = FileUtil.saveFile(file, uploadDir);
            String photoUrl = (serverBaseUrl == null || serverBaseUrl.isBlank())
                    ? relativeUrl
                    : serverBaseUrl + relativeUrl;
            urls.add(photoUrl);
        }
        return urls;
    }
}
