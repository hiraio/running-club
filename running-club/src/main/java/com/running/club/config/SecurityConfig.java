package com.running.club.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http.csrf(csrf -> csrf.disable()) // 테스트를 위해 CSRF 비활성화
				// 1. H2 콘솔 프레임 허용 (H2 사용 시 필수)
				.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))

				// 2. 권한 설정 (순서가 중요합니다!)
				.authorizeHttpRequests(auth -> auth
						// 누구나 접근 가능한 페이지들을 먼저 선언
						.requestMatchers("/h2-console/**", "/join", "/login", "/css/**", "/js/**").permitAll()
						// 그 외의 모든 요청은 로그인 필요 (가장 마지막에 위치해야 함)
						.anyRequest().authenticated())

				// 3. 로그인 설정
				.formLogin(form -> form.loginPage("/login") // 로그인 페이지 경로
						.loginProcessingUrl("/login") // [중요] Postman에서 POST를 보낼 주소
						.usernameParameter("username") // 아이디 파라미터명
						.passwordParameter("password") // 비밀번호 파라미터명
						.defaultSuccessUrl("/") // 성공 시 이동할 곳
						.permitAll())

				// 4. 로그아웃 설정
				.logout(logout -> logout.logoutSuccessUrl("/login").permitAll());

		return http.build();
	}

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // 비밀번호 암호화 도구
    }

    
    
    
    
}