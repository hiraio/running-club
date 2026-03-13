package com.running.club.service;

import com.running.club.domain.Competition;
import com.running.club.domain.CompetitionStatus;
import com.running.club.domain.JoinRequest;
import com.running.club.domain.JoinResponse;
import com.running.club.domain.MeResponse;
import com.running.club.domain.Member;
import com.running.club.domain.RunningGroup;
import com.running.club.domain.Team;
import com.running.club.repository.MemberRepository;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final RunningGroupRepository runningGroupRepository;
    private final PasswordEncoder passwordEncoder;

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
                .build();
    }

    @Transactional
    public JoinResponse join(JoinRequest request) {

        log.info("[JOIN] 서비스 진입 - loginId={}, teamId={}, groupId={}",
                request.getLoginId(), request.getTeamId(), request.getGroupId());

        // ── 1. loginId 중복 검증 ──────────────────────────────────────────────
        log.info("[JOIN] 1단계: loginId 중복 검사 - loginId={}", request.getLoginId());
        memberRepository.findByLoginId(request.getLoginId())
                .ifPresent(m -> {
                    log.warn("[JOIN] 중복 loginId 감지 - loginId={}", request.getLoginId());
                    throw new IllegalStateException("이미 존재하는 아이디입니다.");
                });
        log.info("[JOIN] 1단계 통과: loginId 사용 가능");

        // ── 2. 팀 존재 + 활성 대회 소속 검증 ──────────────────────────────────
        log.info("[JOIN] 2단계: 팀 조회 - teamId={}", request.getTeamId());
        Team team = teamRepository.findByTeamIdWithCompetition(request.getTeamId())
                .orElseThrow(() -> {
                    log.warn("[JOIN] 팀 없음 - teamId={}", request.getTeamId());
                    return new IllegalArgumentException("존재하지 않는 팀입니다. (id=" + request.getTeamId() + ")");
                });
        log.info("[JOIN] 팀 조회 성공 - teamName={}", team.getTeamName());

        Competition competition = team.getCompetition();
        CompetitionStatus status = CompetitionStatus.of(
                competition.getStartDate(), competition.getEndDate(), competition.getIsActive());
        log.info("[JOIN] 대회 상태 확인 - competitionId={}, status={}", competition.getId(), status);
        if (status == CompetitionStatus.FINISHED) {
            log.warn("[JOIN] 종료된 대회 팀에 가입 시도 - teamId={}", request.getTeamId());
            throw new IllegalStateException(
                    "종료된 대회의 팀에는 가입할 수 없습니다. (teamId=" + request.getTeamId() + ")");
        }
        log.info("[JOIN] 2단계 통과: 활성 대회 팀 확인");

        // ── 3. 조 검증 (선택적) ───────────────────────────────────────────────
        RunningGroup group = null;
        if (request.getGroupId() != null) {
            log.info("[JOIN] 3단계: 조 조회 - groupId={}", request.getGroupId());
            group = runningGroupRepository.findByGroupId(request.getGroupId())
                    .orElseThrow(() -> {
                        log.warn("[JOIN] 조 없음 - groupId={}", request.getGroupId());
                        return new IllegalArgumentException("존재하지 않는 조입니다. (id=" + request.getGroupId() + ")");
                    });

            if (!group.getTeam().getId().equals(team.getId())) {
                log.warn("[JOIN] 팀-조 불일치 - groupId={}, groupTeamId={}, requestTeamId={}",
                        request.getGroupId(), group.getTeam().getId(), request.getTeamId());
                throw new IllegalArgumentException(
                        "선택한 조는 해당 팀 소속이 아닙니다. " +
                        "(groupId=" + request.getGroupId() + ", teamId=" + request.getTeamId() + ")");
            }
            log.info("[JOIN] 3단계 통과: 조 검증 완료 - groupName={}", group.getGroupName());
        } else {
            log.info("[JOIN] 3단계 건너뜀: groupId 없음");
        }

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
                .groupName(group != null ? group.getGroupName() : null)
                .build();
    }
}
