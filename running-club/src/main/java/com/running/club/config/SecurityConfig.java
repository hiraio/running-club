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
	                    // 1. 누구나 접근 가능한 경로 (조회 API 추가)
	                    .requestMatchers("/h2-console/**", "/join", "/login", "/css/**", "/js/**").permitAll()
	                    
	                    // 2. [추가] 조회성 API는 인증 없이 허용 (GET 요청만)
	                    .requestMatchers("/api/records/team/**").permitAll() 
	                    
	                    // 3. 만약 내 기록 조회(/api/records/my)도 테스트하고 싶다면?
	                    // 하지만 '내 기록'은 Principal이 필요하므로 permitAll을 해도 
	                    // 로그인 안 하면 코드가 터질 수 있으니 주의하세요!
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