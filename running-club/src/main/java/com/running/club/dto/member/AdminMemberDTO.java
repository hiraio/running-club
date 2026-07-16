package com.running.club.dto.member;

import com.running.club.domain.Member;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminMemberDTO {

    private Integer id;
    private String loginId;
    private String name;
    private String phone;
    private String role;
    private Integer teamId;
    private String teamName;
    private Integer groupId;
    private String groupName;
    private boolean needsSetup;
    private LocalDateTime createdAt;

    public static AdminMemberDTO from(Member m) {
        return AdminMemberDTO.builder()
                .id(m.getId())
                .loginId(m.getLoginId())
                .name(m.getName())
                .phone(m.getPhone())
                .role(m.getRole())
                .teamId(m.getTeam() != null ? m.getTeam().getId() : null)
                .teamName(m.getTeam() != null ? m.getTeam().getTeamName() : null)
                .groupId(m.getRunningGroup() != null ? m.getRunningGroup().getId() : null)
                .groupName(m.getRunningGroup() != null ? m.getRunningGroup().getGroupName() : null)
                .needsSetup(m.needsSetup())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
