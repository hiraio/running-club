# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Location

Spring Boot 프로젝트는 `running-club/` 하위에 있음. 모든 소스 경로는 `running-club/src/main/java/com/running/club/` 기준.

## Commands

```bash
# 빌드
cd running-club && ./mvnw clean package -DskipTests

# 로컬 실행 (H2 DB)
cd running-club && ./mvnw spring-boot:run

# 테스트 전체 실행
cd running-club && ./mvnw test

# 단일 테스트 클래스 실행
cd running-club && ./mvnw test -Dtest=ClassName

# H2 Console (실행 중일 때)
# http://localhost:8080/h2-console
# JDBC URL: jdbc:h2:file:~/runningdb
```

## Architecture

### 패키지 구조

```
config/       SecurityConfig, WebConfig
controller/   HTTP 요청 처리 (REST)
domain/       JPA 엔티티 + DTO (Request/Response/SummaryDTO) 혼재
repository/   Spring Data JPA (JPQL 명시 방식)
service/      비즈니스 로직
util/         FileUtil (SHA-256 해시, 파일 저장)
```

### 도메인 계층 구조

```
Competition → Team → RunningGroup → Member → RunningRecord
```

- `Competition`(1) : `Team`(N) : `RunningGroup`(N) : `Member`(N) : `RunningRecord`(N)
- `Member`는 `team_id`, `group_id` FK를 직접 보유
- `RunningRecord`는 `member_id`, `competition_id` FK를 보유

### 핵심 설계 규칙

**Repository**: Spring Data JPA 메서드 명명 규칙 대신 **모든 쿼리를 `@Query` JPQL로 명시**. N+1은 `JOIN FETCH`로 차단, 대량 수정/삭제는 `@Modifying` 벌크 연산 사용.

**DTO 분리**: 엔티티를 컨트롤러에서 직접 반환하지 않음. 조회 목록용 `XxxSummaryDTO`(JPQL Projection), 단건 응답용 `XxxResponse`, 요청용 `XxxCreateRequest`/`XxxUpdateRequest`로 분리.

**엔티티 불변성**: 모든 엔티티는 `@Getter`만 선언, setter 없음. 변경이 필요한 경우 엔티티 내부에 도메인 메서드(예: `competition.update(...)`) 추가. `@Transactional` 더티 체킹으로 자동 반영하므로 수정 후 `save()` 재호출 불필요.

**트랜잭션**: Service 클래스에 `@Transactional(readOnly = true)` 기본 선언, 쓰기 메서드에 `@Transactional` 개별 오버라이드.

### 인증/보안

- `role` 컬럼은 `"USER"` / `"ADMIN"` 문자열로 DB 저장 (ROLE_ 접두사 없음)
- 권한 체크는 `hasAuthority("ADMIN")` 사용 (`hasRole` 아님)
- `CustomUserDetails`가 `Member` 엔티티를 감싸며, 컨트롤러에서 `@AuthenticationPrincipal CustomUserDetails`로 현재 사용자 접근

### 러닝 기록 검증 (`RunningRecordService`)

업로드 시 두 가지 자동 검증:
1. SHA-256 사진 해시 → DB 중복 체크 (`existsByPhotoHash`)
2. 시속 = 거리 ÷ (duration/3600) → 45km/h 초과 시 거부

사진은 `file.upload.dir` (기본: `C:/running-photos/`) 에 UUID 파일명으로 저장, `/photos/**` 경로로 정적 서빙.

### Competition 상태 계산

`CompetitionStatus`(READY/PROCEEDING/FINISHED)는 DB 컬럼 없이 `startDate`, `endDate`, `isActive` 세 값으로 런타임 계산. `isActive=false`이면 강제 FINISHED.

## 구현 현황

### 완료된 API
| 엔드포인트 | 설명 |
|-----------|------|
| `POST /join` | 회원가입 (teamId/groupId 미반영 - TODO) |
| `POST /login` | Spring Security 처리 |
| `POST /api/records` | 기록+사진 업로드 (해시 중복감지, 속도검증) |
| `GET /api/records/my` | 내 기록 조회 |
| `GET /api/records/team/{teamId}` | 팀 기록 조회 |
| `GET /api/admin/records/waiting` | 승인 대기 목록 |
| `PATCH /api/admin/records/{id}/approve` | 기록 승인 |
| `PATCH /api/admin/records/{id}/reject` | 기록 반려 |
| `GET /api/ranking/teams` | 팀 랭킹 |
| `GET /api/ranking/groups` | 조 랭킹 |
| `GET /api/ranking/members` | 개인 랭킹 |
| `GET /api/admin/competitions` | 대회 목록 (팀 수 포함) |
| `POST /api/admin/competitions` | 대회 생성 |
| `PATCH /api/admin/competitions/{id}` | 대회 수정/상태 토글 |
| `DELETE /api/admin/competitions/{id}` | 대회 삭제 (팀 존재 시 불가) |

### 미구현 (우선순위 순)
1. 관리자 팀/조 관리 API (`/api/admin/competitions/{id}/teams`, `/api/admin/teams/{id}/groups`)
2. 회원가입 지원 조회 (`GET /api/competitions/active`, `GET /api/competitions/{id}/teams`, `GET /api/teams/{id}/groups`)
3. 회원가입에 `teamId`, `groupId` 파라미터 추가
4. 조 기록 조회 (`GET /api/records/group/{groupId}`)
5. 특정 대회 기준 랭킹 API
6. 공지사항 CRUD, 관리자 회원관리

## DB 설정

- **로컬**: H2 파일 DB (`~/runningdb`), `spring.jpa.hibernate.ddl-auto=update`로 스키마 자동 관리
- **운영**: PostgreSQL (Supabase), `application.properties` 상단 주석 처리된 블록을 활성화

운영 전환 시 `application.properties`에서 H2 블록을 주석 처리하고 PostgreSQL 블록을 해제.

## 모니터링

Prometheus 메트릭: `GET /actuator/prometheus`
