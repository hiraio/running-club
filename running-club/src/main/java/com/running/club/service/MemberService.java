package com.running.club.service;

import com.running.club.domain.*;
import java.time.LocalDate;
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

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

        Member member = memberRepository.findByIdWithGroup(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        MemberProfile profile = memberProfileRepository.findByMemberId(memberId).orElse(null);

        double currentDistance = runningRecordRepository.getTotalApprovedDistanceByMember(memberId);
        long totalRuns = runningRecordRepository.countApprovedByMember(memberId);
        boolean ranToday = runningRecordRepository.hasRunToday(memberId, LocalDate.now());

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
                List<RankingDTO> teamRankings = runningRecordRepository.getTeamRankingByCompetition(comp.getId(), comp.getStartDate(), comp.getEndDate());
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
                .ranToday(ranToday)
                .recentRecords(recentDTOs)
                .build();
    }

    /**
     * 다른 회원의 공개 프로필 조회 (읽기 전용 대시보드).
     * rank는 전체 getMemberRanking() 결과에서 찾아서 주입 — 별도 집계 쿼리 없음.
     */
    public MemberPublicProfileResponse getPublicProfile(Integer targetId) {
        Member member = memberRepository.findByIdWithGroup(targetId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. (id=" + targetId + ")"));

        MemberProfile profile = memberProfileRepository.findByMemberId(targetId).orElse(null);

        double totalDistance = runningRecordRepository.getTotalApprovedDistanceByMember(targetId);
        long totalRuns = runningRecordRepository.countApprovedByMember(targetId);

        // 전체 랭킹에서 순위만 추출 (별도 집계 쿼리 없이 재사용)
        List<RankingDTO> allRanks = runningRecordRepository.getMemberRanking();
        for (int i = 0; i < allRanks.size(); i++) allRanks.get(i).setRank(i + 1);
        int rank = allRanks.stream()
                .filter(r -> r.getEntityId().equals(targetId))
                .findFirst().map(RankingDTO::getRank).orElse(0);

        // 최근 5건 (날짜 내림차순)
        List<RunningRecord> recent = runningRecordRepository.findRecentApproved(targetId, PageRequest.of(0, 5));
        List<RunningRecordDTO> recentDTOs = recent.stream().map(RunningRecordDTO::from).toList();

        return MemberPublicProfileResponse.builder()
                .memberId(targetId)
                .name(member.getName())
                .teamName(member.getTeam() != null ? member.getTeam().getTeamName() : null)
                .teamColorCode(member.getTeam() != null ? member.getTeam().getColorCode() : null)
                .groupName(member.getRunningGroup() != null ? member.getRunningGroup().getGroupName() : null)
                .school(profile != null ? profile.getSchool() : null)
                .major(profile != null ? profile.getMajor() : null)
                .bio(profile != null ? profile.getBio() : null)
                .targetDistance(profile != null ? profile.getTargetDistance() : null)
                .totalDistance(totalDistance)
                .totalRuns(totalRuns)
                .memberRank(rank)
                .recentRecords(recentDTOs)
                .build();
    }

    /**
     * 조 전체 멤버 목록 + 각자의 달리기 통계.
     * 전체 랭킹 한 번만 조회 후 Map으로 변환해 N+1 방지.
     */
    public List<GroupMemberDTO> getGroupMembers(Integer groupId) {
        runningGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 조입니다. (id=" + groupId + ")"));

        List<Member> members = memberRepository.findByGroupId(groupId);

        // 전체 랭킹 한 번만 조회 → Map<memberId, RankingDTO>
        List<RankingDTO> allRanks = runningRecordRepository.getMemberRanking();
        for (int i = 0; i < allRanks.size(); i++) allRanks.get(i).setRank(i + 1);
        Map<Integer, RankingDTO> rankMap = allRanks.stream()
                .collect(Collectors.toMap(RankingDTO::getEntityId, r -> r));

        List<GroupMemberDTO> result = members.stream()
                .map(m -> {
                    RankingDTO r = rankMap.get(m.getId());
                    return GroupMemberDTO.builder()
                            .memberId(m.getId())
                            .name(m.getName())
                            .totalDistance(r != null ? r.getTotalDistance() : 0.0)
                            .totalRuns(r != null ? r.getRecordCount() : 0L)
                            .memberRank(r != null ? r.getRank() : 0)
                            .build();
                })
                .sorted(Comparator.comparingDouble(GroupMemberDTO::getTotalDistance).reversed())
                .collect(Collectors.toList());

        return result;
    }

    @Transactional
    public JoinResponse join(JoinRequest request) {
        // 1. loginId 중복 검증
        memberRepository.findByLoginId(request.getLoginId())
                .ifPresent(m -> { throw new IllegalStateException("이미 존재하는 아이디입니다."); });

        // 2. 조 조회 → 팀/대회 자동 도출
        if (request.getGroupId() == null) {
            throw new IllegalArgumentException("조를 선택해야 합니다.");
        }
        RunningGroup group = runningGroupRepository.findByGroupId(request.getGroupId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 조입니다. (id=" + request.getGroupId() + ")"));
        Team team = group.getTeam();

        // 3. 대회 상태 검증
        Competition competition = team.getCompetition();
        CompetitionStatus status = CompetitionStatus.of(
                competition.getStartDate(), competition.getEndDate(), competition.getIsActive());
        if (status == CompetitionStatus.FINISHED) {
            log.warn("[JOIN] 종료된 대회 가입 시도 - competitionId={}, loginId={}", competition.getId(), request.getLoginId());
            throw new IllegalStateException("종료된 대회의 조에는 가입할 수 없습니다.");
        }

        // 4. 비밀번호 암호화 + 회원 저장
        Member member = Member.builder()
                .loginId(request.getLoginId())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role("USER")
                .team(team)
                .runningGroup(group)
                .build();
        memberRepository.save(member);
        log.info("[JOIN] 회원가입 - memberId={}, loginId={}, groupId={}", member.getId(), member.getLoginId(), group.getId());

        return JoinResponse.builder()
                .memberId(member.getId())
                .loginId(member.getLoginId())
                .name(member.getName())
                .teamName(team.getTeamName())
                .groupName(group.getGroupName())
                .build();
    }
}
