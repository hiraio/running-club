package com.running.club.service;

import com.running.club.domain.*;
import com.running.club.repository.MemberProfileRepository;
import com.running.club.repository.MemberRepository;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final RunningGroupRepository runningGroupRepository;
    private final PasswordEncoder passwordEncoder;
    private final MemberProfileRepository memberProfileRepository;
    private final RunningRecordRepository runningRecordRepository;

    /**
     * 회원가입.
     *
     * <p>검증 순서:
     * <ol>
     *   <li>loginId 중복 → IllegalStateException (409 의미, GlobalExceptionHandler가 400으로 처리)</li>
     *   <li>teamId 존재 + 소속 대회 활성 → IllegalArgumentException / IllegalStateException</li>
     *   <li>groupId 존재 + 해당 팀 소속 검증 → IllegalArgumentException (보안: cross-team injection 차단)</li>
     * </ol>
     *
     * @return 가입된 회원 정보 (비밀번호·role 제외)
     */
    /** 현재 로그인한 사용자 정보 반환 */
    public MeResponse getMe(Integer memberId) {
        log.info("[ME] 사용자 정보 조회 - memberId={}", memberId);
        Member member = memberRepository.findByIdWithGroup(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. (id=" + memberId + ")"));
        return MeResponse.builder()
                .id(member.getId())
                .loginId(member.getLoginId())
                .name(member.getName())
                .role(member.getRole())
                .needsSetup(member.needsSetup())
                .groupId(member.getRunningGroup() != null ? member.getRunningGroup().getId() : null)
                .groupName(member.getRunningGroup() != null ? member.getRunningGroup().getGroupName() : null)
                .teamId(member.getTeam() != null ? member.getTeam().getId() : null)
                .teamName(member.getTeam() != null ? member.getTeam().getTeamName() : null)
                .teamColorCode(member.getTeam() != null ? member.getTeam().getColorCode() : null)
                .build();
    }

    /**
     * 개인 대시보드 데이터.
     * member_profiles + running_records(APPROVED) JOIN 집계 결과를 한 번에 반환.
     * 랭킹은 getMemberRanking() 결과에서 현재 멤버를 찾아 순위를 추출.
     */
    public MemberDashboardResponse getDashboard(Integer memberId) {
        log.info("[DASHBOARD] 대시보드 데이터 조회 - memberId={}", memberId);

        Member member = memberRepository.findByIdWithGroup(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        MemberProfile profile = memberProfileRepository.findByMemberId(memberId).orElse(null);

        double currentDistance = runningRecordRepository.getTotalApprovedDistanceByMember(memberId);
        long totalRuns = runningRecordRepository.countApprovedByMember(memberId);

        // 최근 5건 (날짜 내림차순)
        List<RunningRecord> recent = runningRecordRepository.findRecentApproved(memberId, PageRequest.of(0, 5));
        List<RunningRecordDTO> recentDTOs = recent.stream().map(RunningRecordDTO::from).toList();

        // 개인 랭킹에서 내 순위 계산
        List<RankingDTO> allRanks = runningRecordRepository.getMemberRanking();
        for (int i = 0; i < allRanks.size(); i++) allRanks.get(i).setRank(i + 1);
        int myRank = allRanks.stream()
                .filter(r -> r.getEntityId().equals(memberId))
                .findFirst().map(RankingDTO::getRank).orElse(0);

        // 팀 순위 + 현재 대회 ID (대시보드 팀 기여 카드용)
        int teamRank = 0;
        double teamTotalKm = 0.0;
        Integer competitionId = null;
        if (member.getTeam() != null) {
            Competition comp = member.getTeam().getCompetition(); // 트랜잭션 내 lazy 로드
            if (comp != null) {
                competitionId = comp.getId();
                List<RankingDTO> teamRankings = runningRecordRepository.getTeamRankingByCompetition(comp.getId());
                for (int i = 0; i < teamRankings.size(); i++) teamRankings.get(i).setRank(i + 1);
                Integer myTeamId = member.getTeam().getId();
                for (RankingDTO r : teamRankings) {
                    if (r.getEntityId().equals(myTeamId)) {
                        teamRank    = r.getRank();
                        teamTotalKm = r.getTotalDistance();
                        break;
                    }
                }
            }
        }

        log.info("[DASHBOARD] 조회 완료 - memberId={}, km={}, rank={}/{}, teamRank={}",
                memberId, currentDistance, myRank, allRanks.size(), teamRank);

        return MemberDashboardResponse.builder()
                .memberId(memberId)
                .name(member.getName())
                .teamName(member.getTeam() != null ? member.getTeam().getTeamName() : null)
                .teamColorCode(member.getTeam() != null ? member.getTeam().getColorCode() : null)
                .groupName(member.getRunningGroup() != null ? member.getRunningGroup().getGroupName() : null)
                .school(profile != null ? profile.getSchool() : null)
                .major(profile != null ? profile.getMajor() : null)
                .bio(profile != null ? profile.getBio() : null)
                .targetDistance(profile != null ? profile.getTargetDistance() : null)
                .currentDistance(currentDistance)
                .totalRuns(totalRuns)
                .memberRank(myRank)
                .totalRankedMembers(allRanks.size())
                .competitionId(competitionId)
                .teamRank(teamRank)
                .teamTotalKm(teamTotalKm)
                .recentRecords(recentDTOs)
                .build();
    }

    @Transactional
    public JoinResponse join(JoinRequest request) {

        log.info("[JOIN] 서비스 진입 - loginId={}, groupId={}", request.getLoginId(), request.getGroupId());

        // ── 1. loginId 중복 검증 ──────────────────────────────────────────────
        log.info("[JOIN] 1단계: loginId 중복 검사 - loginId={}", request.getLoginId());
        memberRepository.findByLoginId(request.getLoginId())
                .ifPresent(m -> {
                    log.warn("[JOIN] 중복 loginId 감지 - loginId={}", request.getLoginId());
                    throw new IllegalStateException("이미 존재하는 아이디입니다.");
                });
        log.info("[JOIN] 1단계 통과: loginId 사용 가능");

        // ── 2. 조 조회 → 팀/대회 자동 도출 ──────────────────────────────────
        if (request.getGroupId() == null) {
            throw new IllegalArgumentException("조를 선택해야 합니다.");
        }
        log.info("[JOIN] 2단계: 조 조회 - groupId={}", request.getGroupId());
        RunningGroup group = runningGroupRepository.findByGroupId(request.getGroupId())
                .orElseThrow(() -> {
                    log.warn("[JOIN] 조 없음 - groupId={}", request.getGroupId());
                    return new IllegalArgumentException("존재하지 않는 조입니다. (id=" + request.getGroupId() + ")");
                });
        log.info("[JOIN] 조 조회 성공 - groupName={}", group.getGroupName());

        Team team = group.getTeam();
        log.info("[JOIN] 팀 자동 도출 - teamId={}, teamName={}", team.getId(), team.getTeamName());

        // ── 3. 대회 상태 검증 ─────────────────────────────────────────────────
        Competition competition = team.getCompetition();
        CompetitionStatus status = CompetitionStatus.of(
                competition.getStartDate(), competition.getEndDate(), competition.getIsActive());
        log.info("[JOIN] 대회 상태 확인 - competitionId={}, status={}", competition.getId(), status);
        if (status == CompetitionStatus.FINISHED) {
            log.warn("[JOIN] 종료된 대회 가입 시도 - competitionId={}", competition.getId());
            throw new IllegalStateException("종료된 대회의 조에는 가입할 수 없습니다.");
        }
        log.info("[JOIN] 3단계 통과: 활성 대회 확인");

        // ── 4. 비밀번호 암호화 + 회원 저장 ───────────────────────────────────
        log.info("[JOIN] 4단계: 회원 저장 시작");
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        Member member = Member.builder()
                .loginId(request.getLoginId())
                .password(encodedPassword)
                .name(request.getName())
                .role("USER")
                .team(team)
                .runningGroup(group)
                .build();

        memberRepository.save(member);
        log.info("[JOIN] 4단계 완료: 회원 저장 성공 - memberId={}", member.getId());

        // ── 5. 응답 DTO 반환 ─────────────────────────────────────────────────
        return JoinResponse.builder()
                .memberId(member.getId())
                .loginId(member.getLoginId())
                .name(member.getName())
                .teamName(team.getTeamName())
                .groupName(group.getGroupName())
                .build();
    }
}
