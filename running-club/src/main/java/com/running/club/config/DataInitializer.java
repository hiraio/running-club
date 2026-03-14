package com.running.club.config;

import com.running.club.domain.*;
import com.running.club.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * 개발/테스트용 초기 데이터 적재기.
 *
 * application.properties 에서 app.init-test-data=true 일 때만 실행.
 * 서버 기동 시 기존 데이터를 전부 지우고 테스트 데이터를 새로 삽입한다.
 *
 * ⚠️ 운영 환경에서는 반드시 app.init-test-data=false 로 설정할 것.
 *
 * [삭제 순서] FK 의존 방향 역순으로 삭제해야 제약 위반 없음:
 * running_records → members → running_groups → teams → competitions
 *
 * [테스트 계정]
 *  - admin  / admin1234  (ADMIN, 청팀 1조)
 *  - user1  / user1234  (USER, 청팀 1조)
 *  - user2  / user1234  (USER, 청팀 2조)
 *  - user3  / user1234  (USER, 홍팀 1조)
 *  - user4  / user1234  (USER, 홍팀 2조)
 *  - 최초로그인: 이름="VIP테스터", 전화="010-9999-0001" (홍팀 1조, 계정 미설정)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    @Value("${app.init-test-data:false}")
    private boolean initTestData;

    private final JdbcTemplate jdbcTemplate;
    private final CompetitionRepository competitionRepository;
    private final TeamRepository teamRepository;
    private final RunningGroupRepository runningGroupRepository;
    private final MemberRepository memberRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final RunningRecordRepository runningRecordRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // 스키마 패치는 항상 실행 (ddl-auto=update 로 처리 안 되는 컬럼 제약 변경)
        fixSchema();

        if (!initTestData) {
            log.info("[DATA-INIT] app.init-test-data=false — 데이터 초기화 건너뜀 (기존 데이터 유지)");
            return;
        }

        log.info("[DATA-INIT] ====== 테스트 데이터 초기화 시작 ======");
        clearAll();
        insertAll();
        log.info("[DATA-INIT] ====== 테스트 데이터 초기화 완료 ======");
    }

    // ══════════════════════════════════════════════════════════════════
    // 스키마 수정 (ddl-auto=update 로 해결 안 되는 컬럼 제약 변경)
    // ══════════════════════════════════════════════════════════════════

    private void fixSchema() {
        try {
            // login_id NULL 허용 (VIP 최초 로그인 사용자 지원)
            jdbcTemplate.execute("ALTER TABLE members ALTER COLUMN login_id VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE members ALTER COLUMN phone VARCHAR(20)");
            log.info("[DATA-INIT] 스키마 수정 완료 (login_id nullable, phone)");
        } catch (Exception e) {
            log.info("[DATA-INIT] members 스키마 이미 최신");
        }
        try {
            // member_profiles 테이블 생성 (ddl-auto=update 로 미처리될 경우 보완)
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS member_profiles (
                    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
                    member_id  INTEGER NOT NULL UNIQUE,
                    school     VARCHAR(100),
                    major      VARCHAR(100),
                    bio        TEXT,
                    target_distance DOUBLE,
                    profile_image_url VARCHAR(512),
                    FOREIGN KEY (member_id) REFERENCES members(id)
                )
            """);
            log.info("[DATA-INIT] member_profiles 테이블 준비 완료");
        } catch (Exception e) {
            log.info("[DATA-INIT] member_profiles 테이블 이미 존재");
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // 전체 삭제 (FK 순서 준수)
    // ══════════════════════════════════════════════════════════════════

    private void clearAll() {
        log.info("[DATA-INIT] 기존 데이터 삭제 중...");
        runningRecordRepository.deleteAllInBatch();
        memberProfileRepository.deleteAllInBatch();  // members FK 전에 먼저 삭제
        memberRepository.deleteAllInBatch();
        runningGroupRepository.deleteAllInBatch();
        teamRepository.deleteAllInBatch();
        competitionRepository.deleteAllInBatch();
        log.info("[DATA-INIT] 기존 데이터 삭제 완료");
    }

    // ══════════════════════════════════════════════════════════════════
    // 데이터 삽입
    // ══════════════════════════════════════════════════════════════════

    private void insertAll() {
        // ── 1. 대회 ────────────────────────────────────────────────────
        Competition comp = competitionRepository.save(Competition.builder()
                .title("2025 봄 러닝 챌린지")
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2025, 12, 31))
                .isActive(true)
                .build());
        log.info("[DATA-INIT] 대회 생성 - id={}, title={}", comp.getId(), comp.getTitle());

        // ── 2. 팀 ──────────────────────────────────────────────────────
        Team blueTeam = teamRepository.save(Team.builder()
                .competition(comp)
                .teamName("청팀")
                .colorCode("#3B82F6")
                .build());

        Team redTeam = teamRepository.save(Team.builder()
                .competition(comp)
                .teamName("홍팀")
                .colorCode("#EF4444")
                .build());
        log.info("[DATA-INIT] 팀 생성 - 청팀(id={}), 홍팀(id={})", blueTeam.getId(), redTeam.getId());

        // ── 3. 조 ──────────────────────────────────────────────────────
        RunningGroup blue1 = runningGroupRepository.save(RunningGroup.builder().team(blueTeam).groupName("1조").build());
        RunningGroup blue2 = runningGroupRepository.save(RunningGroup.builder().team(blueTeam).groupName("2조").build());
        RunningGroup red1  = runningGroupRepository.save(RunningGroup.builder().team(redTeam).groupName("1조").build());
        RunningGroup red2  = runningGroupRepository.save(RunningGroup.builder().team(redTeam).groupName("2조").build());
        log.info("[DATA-INIT] 조 생성 - 청팀1조(id={}), 청팀2조(id={}), 홍팀1조(id={}), 홍팀2조(id={})",
                blue1.getId(), blue2.getId(), red1.getId(), red2.getId());

        // ── 4. 회원 ────────────────────────────────────────────────────
        String adminPw = passwordEncoder.encode("admin1234");
        String userPw  = passwordEncoder.encode("user1234");

        Member admin = memberRepository.save(Member.builder()
                .loginId("admin").password(adminPw).name("관리자").role("ADMIN")
                .team(blueTeam).runningGroup(blue1).build());

        Member user1 = memberRepository.save(Member.builder()
                .loginId("user1").password(userPw).name("김철수").role("USER")
                .team(blueTeam).runningGroup(blue1).build());

        Member user2 = memberRepository.save(Member.builder()
                .loginId("user2").password(userPw).name("이영희").role("USER")
                .team(blueTeam).runningGroup(blue2).build());

        Member user3 = memberRepository.save(Member.builder()
                .loginId("user3").password(userPw).name("박민준").role("USER")
                .team(redTeam).runningGroup(red1).build());

        Member user4 = memberRepository.save(Member.builder()
                .loginId("user4").password(userPw).name("정수아").role("USER")
                .team(redTeam).runningGroup(red2).build());

        // VIP 최초 로그인 테스트용 (loginId=null, password=null)
        Member vip = memberRepository.save(Member.builder()
                .name("VIP테스터").phone("010-9999-0001").role("USER")
                .team(redTeam).runningGroup(red1).build());

        log.info("[DATA-INIT] 회원 생성 - admin(id={}), user1~4, VIP(id={})", admin.getId(), vip.getId());

        // ── 5. 샘플 프로필 ─────────────────────────────────────────────
        memberProfileRepository.save(MemberProfile.builder()
                .member(user1).school("한국대학교").major("체육학과")
                .bio("아침 러닝을 즐기는 김철수입니다.").targetDistance(100.0).build());

        memberProfileRepository.save(MemberProfile.builder()
                .member(user2).school("서울대학교").major("경영학과")
                .bio("마라톤 완주가 목표입니다!").targetDistance(150.0).build());

        memberProfileRepository.save(MemberProfile.builder()
                .member(user3).school("연세대학교").major("컴퓨터공학과")
                .bio("퇴근 후 러닝으로 스트레스 해소 중.").targetDistance(80.0).build());

        log.info("[DATA-INIT] 샘플 프로필 생성 완료 (3건)");

        // ── 6. 러닝 기록 ───────────────────────────────────────────────
        // user1: APPROVED 2건
        save(user1, comp, 5.0, 1800, "2025-03-01", "APPROVED", null);
        save(user1, comp, 8.3, 2880, "2025-03-15", "APPROVED", null);
        // user1: WAITING 1건 (관리자 승인 대기 테스트용)
        save(user1, comp, 4.2, 1200, "2025-03-22", "WAITING", null);

        // user2: APPROVED 2건
        save(user2, comp, 7.5, 2700, "2025-03-03", "APPROVED", null);
        save(user2, comp, 10.0, 3600, "2025-03-17", "APPROVED", null);

        // user3: APPROVED 1건, WAITING 1건, REJECTED 1건
        save(user3, comp, 6.0, 2100, "2025-03-05", "APPROVED", null);
        save(user3, comp, 5.5, 1800, "2025-03-20", "WAITING", null);
        save(user3, comp, 3.0, 900, "2025-03-10", "REJECTED", "페이스 의심 — 추가 인증 요청");

        // user4: WAITING 2건
        save(user4, comp, 9.1, 3300, "2025-03-07", "WAITING", null);
        save(user4, comp, 4.5, 1500, "2025-03-21", "WAITING", null);

        log.info("[DATA-INIT] 러닝 기록 생성 완료 (총 10건)");
    }

    private void save(Member member, Competition comp,
                      double distance, int duration,
                      String dateStr, String status, String rejectedReason) {
        runningRecordRepository.save(RunningRecord.builder()
                .member(member)
                .competition(comp)
                .distance(distance)
                .duration(duration)
                .runningDate(LocalDate.parse(dateStr))
                .status(status)
                .rejectedReason(rejectedReason)
                .build());
    }
}
