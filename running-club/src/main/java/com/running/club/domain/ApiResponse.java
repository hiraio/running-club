package com.running.club.domain;

import lombok.Builder;
import lombok.Getter;

/**
 * 공통 API 응답 포맷.
 *
 * <p>프론트엔드(Vue.js)에서 success 플래그 하나로 성공/실패를 일관되게 분기 가능.
 * <pre>
 * 성공: { "success": true,  "data": [...], "message": null }
 * 실패: { "success": false, "data": null,  "message": "에러 내용" }
 * </pre>
 */
@Getter
@Builder
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final String message;

    /** 정상 응답 — data만 감쌈 */
    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    /** 에러 응답 — message만 채움 */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}
