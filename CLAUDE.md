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
config/       SecurityConfig, WebConfig, GlobalExceptionHandler
controller/   HTTP 요청 처리 (REST)
domain/       JPA 엔티티 + DTO (Request/Response/SummaryDTO/ForJoinDTO) 혼재
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

**DTO 분리**: 엔티티를 컨트롤러에서 직접 반환하지 않음.
- 관리자 목록용: `XxxSummaryDTO` (JPQL Projection, COUNT 집계 포함)
- 관리자 단건 응답: `XxxResponse` (정적 팩토리 `from(entity)`)
- 요청용: `XxxCreateRequest` / `XxxUpdateRequest`
- **공개 API 전용 경량 DTO**: `XxxForJoinDTO` (회원가입 화면용, 최소 필드만)

**엔티티 불변성**: 모든 엔티티는 `@Getter`만 선언, setter 없음. 변경이 필요한 경우 엔티티 내부에 도메인 메서드(예: `competition.update(...)`) 추가. `@Transactional` 더티 체킹으로 자동 반영하므로 수정 후 `save()` 재호출 불필요.

**트랜잭션**: Service 클래스에 `@Transactional(readOnly = true)` 기본 선언, 쓰기 메서드에 `@Transactional` 개별 오버라이드.

**공통 응답 포맷**: 퍼블릭 API(인증 불필요)는 `ApiResponse<T>` 래퍼로 반환.
```json
{ "success": true,  "data": [...], "message": null }
{ "success": false, "data": null,  "message": "에러 메시지" }
```
관리자 API는 기존 방식(ResponseEntity 직접 반환) 유지.

**전역 예외 처리**: `GlobalExceptionHandler`(@RestControllerAdvice)가 모든 컨트롤러의 `IllegalArgumentException` → 400, `IllegalStateException` → 400 으로 변환. Admin API 포함 전체 적용.

**삭제 안전장치 (참조 무결성)**:
- 대회 삭제: 소속 팀 존재 시 차단
- 팀 삭제: 소속 멤버 존재 시 차단 / 소속 조는 `CascadeType.ALL` 자동 삭제
- 조 삭제: 소속 멤버 존재 시 차단

### 인증/보안

- `role` 컬럼은 `"USER"` / `"ADMIN"` 문자열로 DB 저장 (ROLE_ 접두사 없음)
- 권한 체크는 `hasAuthority("ADMIN")` 사용 (`hasRole` 아님)
- `CustomUserDetails`가 `Member` 엔티티를 감싸며, 컨트롤러에서 `@AuthenticationPrincipal CustomUserDetails`로 현재 사용자 접근
- `getAuthorities()`는 `new SimpleGrantedAuthority(member.getRole())` 사용 (람다 사용 금지 — Serializable 미구현으로 세션 불안정)

**SecurityConfig permitAll 경로** (인증 불필요):
```
/h2-console/**, /join, /login, /css/**, /js/**, /photos/**
/api/records/team/**, /api/ranking/**
/api/competitions/**, /api/teams/**   ← 회원가입 지원 공개 API
```
`/api/admin/**` → ADMIN 권한 필요

**테스트 유저 생성 방법** (BCrypt 해시 직접 삽입 금지):
1. `POST /join` 으로 유저 생성 (Spring이 BCrypt 해시 자동 생성)
2. H2 Console: `UPDATE members SET role='ADMIN' WHERE login_id='admin';`

### 러닝 기록 검증 (`RunningRecordService`)

업로드 시 두 가지 자동 검증:
1. SHA-256 사진 해시 → DB 중복 체크 (`existsByPhotoHash`)
2. 시속 = 거리 ÷ (duration/3600) → 45km/h 초과 시 거부

사진은 `file.upload.dir` (기본: `C:/running-photos/`) 에 UUID 파일명으로 저장, `/photos/**` 경로로 정적 서빙.

### Competition 상태 계산

`CompetitionStatus`(READY/PROCEEDING/FINISHED)는 DB 컬럼 없이 `startDate`, `endDate`, `isActive` 세 값으로 런타임 계산. `isActive=false`이면 강제 FINISHED.

## 구현 현황

### 완료된 API

#### 인증
| 엔드포인트 | 설명 |
|-----------|------|
| `POST /join` | 회원가입 (JSON body: loginId/password/name/teamId/groupId, 201 Created + ApiResponse) |
| `POST /login` | Spring Security 처리 |

#### 관리자 — 대회/팀/조 관리
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/admin/competitions` | 대회 목록 (팀 수 포함) |
| `POST /api/admin/competitions` | 대회 생성 |
| `PATCH /api/admin/competitions/{id}` | 대회 수정/상태 토글 |
| `DELETE /api/admin/competitions/{id}` | 대회 삭제 (팀 존재 시 불가) |
| `GET /api/admin/competitions/{id}/teams` | 대회별 팀 목록 (조 수 포함) |
| `POST /api/admin/competitions/{id}/teams` | 팀 생성 |
| `PATCH /api/admin/teams/{id}` | 팀 수정 (부분 업데이트) |
| `DELETE /api/admin/teams/{id}` | 팀 삭제 (멤버 존재 시 불가, 조 Cascade 삭제) |
| `GET /api/admin/teams/{id}/groups` | 팀별 조 목록 |
| `POST /api/admin/teams/{id}/groups` | 조 생성 |
| `PATCH /api/admin/groups/{id}` | 조 수정 |
| `DELETE /api/admin/groups/{id}` | 조 삭제 (멤버 존재 시 불가) |

#### 관리자 — 기록 승인
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/admin/records/waiting` | 승인 대기 목록 |
| `PATCH /api/admin/records/{id}/approve` | 기록 승인 |
| `PATCH /api/admin/records/{id}/reject` | 기록 반려 (`?reason=사유`) |

#### 공개 — 회원가입 지원 (인증 불필요)
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/competitions/active` | 활성 대회 목록 (READY+PROCEEDING, ApiResponse 포맷) |
| `GET /api/competitions/{id}/teams` | 대회별 팀 목록 (종료 대회 400 차단, ApiResponse 포맷) |
| `GET /api/teams/{id}/groups` | 팀별 조 목록 (빈 배열 정상 반환, ApiResponse 포맷) |

#### 유저 — 기록
| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/records` | 기록+사진 업로드 (해시 중복감지, 속도검증, competition 자동 도출) |
| `GET /api/records/my` | 내 기록 조회 |
| `GET /api/records/team/{teamId}` | 팀 기록 조회 (인증 불필요) |
| `GET /api/records/group/{groupId}` | 조 기록 조회 (인증 불필요) |

#### 랭킹 (인증 불필요)
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/ranking/teams` | 팀 랭킹 (전체 또는 `?competitionId=` 필터) |
| `GET /api/ranking/groups` | 조 랭킹 (전체 또는 `?competitionId=` 필터) |
| `GET /api/ranking/members` | 개인 랭킹 (전체 또는 `?competitionId=` 필터) |

### 미구현 (우선순위 순)
1. 공지사항 CRUD (`GET /api/notices`, `GET /api/notices/{id}`, `POST/PATCH/DELETE /api/admin/notices/{id}`)
2. 관리자 회원 관리

## 주요 파일 목록

### 신규 생성
```
domain/
  ApiResponse.java              공통 응답 래퍼 (퍼블릭 API 전용)
  JoinRequest.java              회원가입 요청 DTO
  JoinResponse.java             회원가입 응답 DTO
  TeamCreateRequest.java / TeamUpdateRequest.java / TeamSummaryDTO.java / TeamResponse.java
  RunningGroupCreateRequest.java / RunningGroupUpdateRequest.java / RunningGroupResponse.java
  CompetitionForJoinDTO.java / TeamForJoinDTO.java / GroupForJoinDTO.java

repository/
  TeamRepository.java           findTeamsForJoin() + findByTeamIdWithCompetition() 등
  RunningGroupRepository.java   findGroupsForJoin() + countMembersByGroupId() 등

service/
  AdminTeamService.java          팀/조 CRUD
  PublicCompetitionService.java  회원가입 지원 조회
  MemberService.java             join() 재작성 (팀/조 검증 포함)
  RankingService.java            competitionId 필터 분기

controller/
  AdminTeamController.java       /api/admin/competitions|teams|groups
  CompetitionController.java     /api/competitions/**, /api/teams/**

config/
  GlobalExceptionHandler.java    IllegalArgumentException/IllegalStateException → 400
```

### 수정된 파일
```
domain/Competition.java          update() PATCH 시맨틱 (null=유지)
domain/Team.java                 CascadeType.ALL + orphanRemoval + update()
domain/RunningGroup.java         update() 도메인 메서드
domain/CustomUserDetails.java    getAuthorities() → SimpleGrantedAuthority (람다 금지)
repository/CompetitionRepository findActiveCompetitions() 추가
repository/RunningRecordRepository findByMember/findByTeamId JOIN FETCH 추가
                                  findByGroupId() + 대회별 랭킹 쿼리 3개 추가
service/AdminCompetitionService  delete() 존재 검증 추가 + update() 날짜 병합 검증
service/RunningRecordService     competition 자동 도출 + jakarta→Spring @Transactional
controller/MemberController.java @RequestBody JoinRequest + ApiResponse 반환
controller/RankingController     ?competitionId 선택 파라미터 추가
controller/RunningRecordController GET /api/records/group/{groupId} 추가
config/SecurityConfig.java       /api/records/group/**, /api/competitions/**, /api/teams/** permitAll
config/WebConfig.java            CORS 설정 (localhost:3000, allowCredentials=true)
```

## DB 설정

- **로컬**: H2 파일 DB (`~/runningdb`), `spring.jpa.hibernate.ddl-auto=update`로 스키마 자동 관리
- **운영**: PostgreSQL (Supabase), `application.properties` 상단 주석 처리된 블록을 활성화

운영 전환 시 `application.properties`에서 H2 블록을 주석 처리하고 PostgreSQL 블록을 해제.

## 모니터링

Prometheus 메트릭: `GET /actuator/prometheus`
