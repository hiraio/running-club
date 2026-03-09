package com.running.club.controller;

import com.running.club.domain.Member;
import com.running.club.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@RestController // @Controller 대신 이걸 사용하세요!
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @PostMapping("/join")
    public String join(String loginId, String password, String name) {
        Member member = Member.builder()
                .loginId(loginId)
                .password(password)
                .name(name)
                .build();
        
        memberService.join(member);
        return "Join Success! User ID: " + loginId; // HTML 파일 대신 이 문자열을 반환합니다.
    }
    
    @GetMapping("/login")
    public String loginPage() {
        return "로그인 페이지입니다. POST로 아이디와 비번을 보내주세요.";
    }
    
    @PostMapping("/login")
    @ResponseBody
    public String loginTest() {
    	log.info("시큐리티 필터가 이 요청을 가로채지 못하고 컨트롤러까지 도달했습니다!");
        return "시큐리티 필터가 이 요청을 가로채지 못하고 컨트롤러까지 도달했습니다!";
    }
}