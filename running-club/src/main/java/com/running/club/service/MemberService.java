package com.running.club.service;

import com.running.club.domain.Competition;
import com.running.club.domain.CompetitionStatus;
import com.running.club.domain.JoinRequest;
import com.running.club.domain.JoinResponse;
import com.running.club.domain.Member;
import com.running.club.domain.RunningGroup;
import com.running.club.domain.Team;
import com.running.club.repository.MemberRepository;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    @Transactional
    public JoinResponse join(JoinRequest request) {

        // ── 1. loginId 중복 검증 ──────────────────────────────────────────────
        memberRepository.findByLoginId(request.getLoginId())
                .ifPresent(m -> {
                    throw new IllegalStateException("이미 존재하는 아이디입니다.");
                });

        // ── 2. 팀 존재 + 활성 대회 소속 검증 ──────────────────────────────────
        // JOIN FETCH로 competition까지 한 번에 로딩 → CompetitionStatus 계산 시 추가 쿼리 없음
        Team team = teamRepository.findByTeamIdWithCompetition(request.getTeamId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 팀입니다. (id=" + request.getTeamId() + ")"));

        Competition competition = team.getCompetition();
        CompetitionStatus status = CompetitionStatus.of(
                competition.getStartDate(), competition.getEndDate(), competition.getIsActive());
        if (status == CompetitionStatus.FINISHED) {
            throw new IllegalStateException(
                    "종료된 대회의 팀에는 가입할 수 없습니다. (teamId=" + request.getTeamId() + ")");
        }

        // ── 3. 조 검증 (선택적) ───────────────────────────────────────────────
        // findByGroupId는 JOIN FETCH team 포함 → group.getTeam().getId() 추가 쿼리 없음
        RunningGroup group = null;
        if (request.getGroupId() != null) {
            group = runningGroupRepository.findByGroupId(request.getGroupId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "존재하지 않는 조입니다. (id=" + request.getGroupId() + ")"));

            // 보안: 요청한 groupId가 요청한 teamId 소속인지 검증
            // 미검증 시 → 타 팀 groupId 전달로 소속 팀·조 불일치 데이터 삽입 가능
            if (!group.getTeam().getId().equals(team.getId())) {
                throw new IllegalArgumentException(
                        "선택한 조는 해당 팀 소속이 아닙니다. " +
                        "(groupId=" + request.getGroupId() + ", teamId=" + request.getTeamId() + ")");
            }
        }

        // ── 4. 비밀번호 암호화 + 회원 저장 ───────────────────────────────────
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
