package com.running.club.dto.competition;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TeamCreateRequest {

    private String teamName;   // 필수
    private String colorCode;  // 선택 (팀 구분 색상, 예: "#FF5733")
}
