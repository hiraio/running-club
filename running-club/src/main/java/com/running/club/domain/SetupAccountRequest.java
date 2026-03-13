package com.running.club.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SetupAccountRequest {
    private String loginId;
    private String password;
}
