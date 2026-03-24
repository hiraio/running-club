package com.running.club.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.core.annotation.Order;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	// Actuator 전용 필터체인 — 메인보다 우선 적용
	@Bean
	@Order(1)
	public SecurityFilterChain actuatorFilterChain(HttpSecurity http) throws Exception {
		http.securityMatcher("/actuator/**")
			.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
			.csrf(csrf -> csrf.disable());
		return http.build();
	}

	@Bean
	@Order(2)
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	    http.cors(Customizer.withDefaults())
	            .csrf(csrf -> csrf.disable())
	            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
	            .authorizeHttpRequests(auth -> auth
	                    // 0. CORS 프리플라이트(OPTIONS)는 인증 없이 항상 허용
	                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

	                    // 1. 누구나 접근 가능한 경로
	                    .requestMatchers("/h2-console/**", "/join", "/login", "/css/**", "/js/**", "/photos/**", "/actuator/**").permitAll()

	                    // 2. JSON 인증 API (최초 로그인 / 일반 로그인 / 계정 설정)
	                    .requestMatchers("/api/auth/first-login", "/api/auth/login", "/api/auth/setup-account").permitAll()

	                    // 3. 조회성 API는 인증 없이 허용
	                    .requestMatchers("/api/records/team/**", "/api/records/group/**",
	                                     "/api/records/recent", "/api/ranking/**").permitAll()

	                    // 3-1. 공지사항 공개 조회 (인증 불필요)
	                    .requestMatchers("/api/notices/**").permitAll()

	                    // 4. 회원가입 지원 공개 조회 API (인증 불필요)
	                    .requestMatchers("/api/competitions/**", "/api/teams/**").permitAll()

	                    // 5. 관리자 전용 API - ADMIN 권한 필요 (DB에 "ADMIN"으로 저장하므로 hasAuthority 사용)
	                    .requestMatchers("/api/admin/**").hasAuthority("ADMIN")

	                    .anyRequest().authenticated())

			// API 경로 미인증 시 redirect 대신 401 반환 (프론트에서 JSON 파싱 실패 방지)
			.exceptionHandling(ex -> ex
					.defaultAuthenticationEntryPointFor(
							(req, res, e) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"),
							new AntPathRequestMatcher("/api/**")))

			// 로그인 설정 (form login은 /login URL 유지, JSON 로그인은 /api/auth/login)
			.formLogin(form -> form.loginPage("/login")
					.loginProcessingUrl("/login")
					.usernameParameter("username")
					.passwordParameter("password")
					.defaultSuccessUrl("/")
					.permitAll())

			// 로그아웃 설정 — API 클라이언트는 302 redirect를 CORS 에러로 처리하므로 200 반환
			.logout(logout -> logout
					.logoutSuccessHandler((req, res, auth) -> res.setStatus(HttpServletResponse.SC_OK))
					.permitAll());

		return http.build();
	}

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
