package com.running.club.dto.competition;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RunningGroupUpdateRequest {

    private String groupName; // 필수 (수정 시 반드시 제공)
}
