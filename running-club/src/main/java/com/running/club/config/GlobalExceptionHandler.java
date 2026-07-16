package com.running.club.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.running.club.dto.common.ApiResponse;

/**
 * 전역 예외 핸들러.
 *
 * <p>서비스 레이어에서 던진 예외를 가로채 ApiResponse 포맷으로 통일하여 반환.
 * 기존 Admin API도 이 핸들러 적용 범위에 포함되어 모든 에러 응답이 일관된 구조를 가짐.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 잘못된 요청 처리 (존재하지 않는 ID, 필수 값 누락 등).
     * HTTP 400 Bad Request 반환.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
    }

    /**
     * 비즈니스 규칙 위반 처리 (멤버 존재 팀 삭제 시도, 종료 대회 접근 등).
     * HTTP 400 Bad Request 반환.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
    }
}
