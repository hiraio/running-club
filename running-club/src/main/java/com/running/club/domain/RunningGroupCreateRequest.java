package com.running.club.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RunningGroupCreateRequest {

    private String groupName; // 필수 (예: "1조", "알파팀")
}
