package com.running.club.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /photos/파일명 요청 → C:/running-photos/파일명 파일 반환
        registry.addResourceHandler("/photos/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }

    /**
     * CORS 설정 — Next.js 개발 서버(localhost:3000)에서의 API 호출 허용.
     * allowCredentials=true: 세션 쿠키(JSESSIONID)를 포함한 요청 허용.
     * 운영 배포 시 allowedOrigins를 실제 도메인으로 교체.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)     // 세션 쿠키 전달 필수
                .maxAge(3600);
    }
}
