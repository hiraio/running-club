package com.running.club.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TeamUpdateRequest {

    // PATCH 의미론: null 전달 시 해당 필드 변경하지 않음
    private String teamName;
    private String colorCode;
}
