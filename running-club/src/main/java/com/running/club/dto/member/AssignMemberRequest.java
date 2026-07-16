package com.running.club.dto.member;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AssignMemberRequest {
    private Integer teamId;   // null = 팀 배정 해제
    private Integer groupId;  // null = 조 배정 해제
}
