package com.running.club.dto.auth;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FirstLoginRequest {
    private String name;
    private String phone;
}
