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
	    http.csrf(csrf -> csrf.disable())
	            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
	            .authorizeHttpRequests(auth -> auth
	                    // 1. 누구나 접근 가능한 경로
	                    .requestMatchers("/h2-console/**", "/join", "/login", "/css/**", "/js/**", "/photos/**").permitAll()
	                    
	                    // 2. 조회성 API는 인증 없이 허용
	                    .requestMatchers("/api/records/team/**", "/api/records/group/**", "/api/ranking/**").permitAll()

	                    // 3. 회원가입 지원 공개 조회 API (인증 불필요)
	                    .requestMatchers("/api/competitions/**", "/api/teams/**").permitAll()

	                    // 4. 관리자 전용 API - ADMIN 권한 필요 (DB에 "ADMIN"으로 저장하므로 hasAuthority 사용)
	                    .requestMatchers("/api/admin/**").hasAuthority("ADMIN")

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