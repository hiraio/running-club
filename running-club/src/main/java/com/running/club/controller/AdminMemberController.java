package com.running.club.controller;

import com.running.club.dto.member.AdminMemberDTO;
import com.running.club.dto.member.AssignMemberRequest;
import com.running.club.domain.Member;
import com.running.club.domain.RunningGroup;
import com.running.club.domain.Team;
import com.running.club.repository.MemberRepository;
import com.running.club.repository.RunningGroupRepository;
import com.running.club.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminMemberController {

    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final RunningGroupRepository runningGroupRepository;

    /**
     * 전체 회원 조회 (팀/조 포함).
     * 검색·필터는 프론트에서 처리 (러닝클럽 규모 특성상 클라이언트 필터링이 적절).
     */
    @GetMapping("/members")
    public ResponseEntity<List<AdminMemberDTO>> getMembers() {
        return ResponseEntity.ok(memberRepository.findAllWithTeamAndGroup()
                .stream()
                .map(AdminMemberDTO::from)
                .toList());
    }

    /**
     * 회원 팀/조 배정.
     * - teamId=null → 팀+조 모두 해제
     * - teamId 있고 groupId=null → 팀만 배정
     * - teamId + groupId → 완전 배정 (group이 해당 team 소속인지 서버에서 검증)
     */
    @Transactional
    @PatchMapping("/members/{id}/assign")
    public ResponseEntity<AdminMemberDTO> assignMember(
            @PathVariable Integer id,
            @RequestBody AssignMemberRequest request) {

        Member member = memberRepository.findByIdWithGroup(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Team team = null;
        RunningGroup group = null;

        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new IllegalArgumentException("팀을 찾을 수 없습니다."));
        }

        if (request.getGroupId() != null) {
            if (team == null) {
                throw new IllegalArgumentException("팀 없이 조만 배정할 수 없습니다.");
            }
            group = runningGroupRepository.findByGroupId(request.getGroupId())
                    .orElseThrow(() -> new IllegalArgumentException("조를 찾을 수 없습니다."));
            // 조가 선택한 팀에 속하는지 검증
            if (!group.getTeam().getId().equals(request.getTeamId())) {
                throw new IllegalArgumentException("선택한 조는 해당 팀에 속하지 않습니다.");
            }
        }

        member.assignTeamAndGroup(team, group);

        log.info("[ADMIN] 회원 배정 - memberId={}, teamId={}, groupId={}",
                id, request.getTeamId(), request.getGroupId());
        return ResponseEntity.ok(AdminMemberDTO.from(member));
    }
}
