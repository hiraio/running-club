package com.running.club.scheduler;

import com.running.club.service.RankSnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 순위 스냅샷 스케줄러.
 *
 * <p>1. 서버 기동 완료 후 1회 즉시 실행 (ApplicationReadyEvent)
 *    — 서버가 자정 이외에 재시작되어도 당일 스냅샷을 보장.
 * <p>2. 매일 자정(KST 00:00) 정기 실행.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RankScheduler {

    private final RankSnapshotService rankSnapshotService;

    /** 서버 기동 완료 시 1회 실행 — 당일 스냅샷 보장 */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("[SCHEDULER] 서버 기동 — 초기 순위 스냅샷 실행");
        try {
            rankSnapshotService.saveSnapshot();
        } catch (Exception e) {
            log.warn("[SCHEDULER] 초기 스냅샷 실패 (무시): {}", e.getMessage());
        }
    }

    /** 매일 자정 KST 정기 실행 */
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Seoul")
    public void scheduleDailySnapshot() {
        log.info("[SCHEDULER] 일일 순위 스냅샷 스케줄 실행");
        try {
            rankSnapshotService.saveSnapshot();
        } catch (Exception e) {
            log.error("[SCHEDULER] 일일 스냅샷 실패: {}", e.getMessage(), e);
        }
    }
}
