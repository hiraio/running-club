# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Location

Spring Boot 프로젝트는 `running-club/` 하위에 있음. 모든 소스 경로는 `running-club/src/main/java/com/running/club/` 기준.
Next.js 프론트엔드는 `running-club-front/` 하위에 있음.

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

# 프론트엔드 실행
cd running-club-front && npm run dev
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
관리자 API 및 인증 API는 ResponseEntity 직접 반환 유지.

**전역 예외 처리**: `GlobalExceptionHandler`(@RestControllerAdvice)가 모든 컨트롤러의 `IllegalArgumentException` → 400, `IllegalStateException` → 400 으로 변환.

**삭제 안전장치 (참조 무결성)**:
- 대회 삭제: 소속 팀 존재 시 차단
- 팀 삭제: 소속 멤버 존재 시 차단 / 소속 조는 `CascadeType.ALL` 자동 삭제
- 조 삭제: 소속 멤버 존재 시 차단

---

## 인증/보안 시스템 (중요)

### 설계 구조

| 방식 | 엔드포인트 | 대상 |
|------|-----------|------|
| 최초 로그인 | `POST /api/auth/first-login` | 관리자가 DB에 이름+전화로 사전 등록한 VIP 사용자 |
| 일반 로그인 | `POST /api/auth/login` | loginId+password 설정 완료 사용자 |
| 계정 설정 | `POST /api/auth/setup-account` | 최초 로그인 직후, 인증된 상태에서만 호출 |
| 내 정보 | `GET /api/me` | 현재 세션 사용자 정보 |
| 로그아웃 | `POST /logout` | Spring Security 처리 |

### 인증 흐름

```
[최초 로그인 경로]
이름+전화번호 입력 → POST /api/auth/first-login
  → 서버: DB에서 name+phone으로 Member 조회
  → 성공: 세션 수립 (HttpSessionSecurityContextRepository)
  → 응답: MeResponse { needsSetup: true }
  → 프론트: /setup-account 리다이렉트
  → loginId+password 입력 → POST /api/auth/setup-account
  → 이후 일반 로그인으로 재진입

[일반 로그인 경로]
loginId+password 입력 → POST /api/auth/login (JSON)
  → 서버: AuthenticationManager.authenticate()
  → 성공: 세션 수립
  → 응답: MeResponse { needsSetup: false, role }
  → 프론트: role에 따라 /admin 또는 /dashboard
```

### MeResponse 구조 (GET /api/me 응답)
```json
{
  "id": 1,
  "loginId": "user01",   // 계정 미설정 시 null
  "name": "홍길동",
  "role": "USER",
  "needsSetup": false,   // true이면 /setup-account 강제 이동
  "groupId": 2,          // 조 미배정 시 null
  "groupName": "2조"     // 조 미배정 시 null
}
```

### ⚠️ 주의사항

**1. loginId NULL 허용 (DB 스키마 변경)**
- `Member.loginId` 컬럼이 기존 `NOT NULL` → `NULL 허용`으로 변경됨
- `ddl-auto=update`로 H2는 자동 반영되지 않을 수 있음
- **H2 파일 DB 재시작 필요**: `~/runningdb.mv.db` 삭제 후 서버 재시작
- PostgreSQL(운영) 전환 시 반드시 마이그레이션: `ALTER TABLE members ALTER COLUMN login_id DROP NOT NULL;`

**2. VIP 사전 등록 방법**
- `phone` 컬럼이 추가됨. VIP 멤버는 SQL INSERT로 직접 삽입:
```sql
INSERT INTO members (login_id, password, name, role, phone, created_at)
VALUES (NULL, NULL, '홍길동', 'USER', '010-1234-5678', NOW());
```
- `loginId=null`, `password=null`이면 `needsSetup=true` 자동 감지

**3. 일반 로그인 방식 변경**
- 기존: Spring Security form login (`application/x-www-form-urlencoded` → `/login`)
- 변경: JSON 방식 (`application/json` → `/api/auth/login`)
- Postman 등으로 테스트 시 Content-Type: application/json, Body: `{"loginId":"...","password":"..."}`

**4. CustomUserDetails + 세션**
- `getAuthorities()`는 반드시 `new SimpleGrantedAuthority(member.getRole())` 사용 (람다 금지 — Serializable 미구현)
- 세션에 저장된 `CustomUserDetails`의 loginId가 null일 수 있음 (최초 로그인 사용자) — 이 상태에서 `/api/auth/setup-account` 호출 가능, `memberId`로 식별

**5. SecurityConfig permitAll 경로**
```
/h2-console/**, /join, /login, /css/**, /js/**, /photos/**
/api/auth/first-login, /api/auth/login    ← JSON 인증 엔드포인트
/api/records/team/**, /api/records/group/**, /api/ranking/**
/api/competitions/**, /api/teams/**
/api/notices/**                           ← 공지사항 공개 조회
OPTIONS /**                               ← CORS 프리플라이트 전체 허용 (rule 0)
```
`/api/auth/setup-account`는 **permitAll 아님** — 반드시 인증 세션 필요

**6. 로그아웃 설정 (중요)**
- `LogoutFilter`는 `DispatcherServlet` 앞에서 실행되어 CORS 헤더가 없는 302 redirect를 반환함
- 이를 방지하기 위해 `logoutSuccessHandler`로 HTTP 200 반환으로 변경:
```java
.logout(logout -> logout
    .logoutSuccessHandler((req, res, auth) -> res.setStatus(HttpServletResponse.SC_OK))
    .permitAll())
```
- 프론트 `auth-context.tsx`의 `logout()`은 `apiLogout()` 실패와 무관하게 클라이언트 상태를 정리:
```typescript
try { await apiLogout(); } catch { /* 세션 만료 등 무시 */ }
setUserState(null); setRoleCookie(null); localStorage.removeItem("loggedIn");
```

**7. CORS 설정 (WebConfig)**
- `allowedMethods`에 `GET, POST, PUT, PATCH, DELETE, OPTIONS` 모두 포함
- `allowedOrigins`: `http://localhost:3000`

---

## 프론트엔드 구조

### 주요 파일

```
lib/
  api.ts              API 호출 함수 전체 (credentials: include 기본)
  auth-context.tsx    AuthProvider, useAuth() — user 상태 + user-role 쿠키 관리
  types.ts            AuthUser, RunningRecord, CompetitionBattle, NoticeSummary 등 공유 타입

middleware.ts         Edge runtime 라우트 보호 (user-role 쿠키 기반)
                      /notices는 matcher에서 제외 — 인증 없이 공개 접근

app/
  login/page.tsx      로그인 (일반/최초 탭 전환)
  setup-account/      최초 로그인 후 계정 설정 (Step1: 계정, Step2: 프로필)
  dashboard/          사용자 대시보드 (프로필 + Team Battle 카드 + 목표 게이지 + 최근 기록)
  competition/        대회 현황 (팀 배틀 VS바, 조 기여 랭킹, 오늘의 MVP, D-Day)
  records/            내 기록
  ranking/            랭킹
  notices/            공지사항 목록 (공개, 필독/대회소식 배지, 새 공지 dot)
  notices/[id]/       공지사항 상세 (Markdown 렌더링, react-markdown + remark-gfm)
  admin/              관리자 홈
  admin/approvals/    기록 승인
  admin/competitions/ 대회 관리
  admin/notices/      공지사항 관리 (생성/삭제 다이얼로그)

components/
  NavigationWrapper.tsx   경로+인증 상태 기반 네비게이션 선택
  UserSidebar.tsx          사용자용 (대시보드/대회현황/내기록/랭킹/공지사항)
                           공지사항 메뉴에 새 글 있을 때 파란 dot 표시
                           localStorage.noticesLastSeen 기준으로 판단
  AdminSidebar.tsx         관리자용 (관리자홈/기록승인/대회관리/공지사항)
  Navbar.tsx               비로그인 및 공개 페이지용 상단 바
  WelcomeOverlay.tsx       최초 로그인 후 3초 환영 오버레이
  GoalProgressRing.tsx     원형 목표 달성 게이지
```

### 네비게이션 선택 로직 (NavigationWrapper)

```
/admin/** → AdminSidebar
/dashboard, /competition, /records, /ranking, /notices + 로그인 상태 → UserSidebar (ADMIN이면 AdminSidebar)
그 외 (공개 경로, 미로그인) → Navbar
```

### AuthUser 타입 (lib/types.ts)

```ts
interface AuthUser {
  id: number;
  loginId: string | null;  // 계정 미설정 VIP는 null
  name: string;
  role: "USER" | "ADMIN";
  needsSetup: boolean;
  groupId: number | null;
  groupName: string | null;
}
```

### 미들웨어 보호 경로 (middleware.ts)

| 경로 | 조건 |
|------|------|
| `/admin/**` | `user-role=ADMIN` 필요, USER → `/dashboard` |
| `/dashboard`, `/competition`, `/records/**` | 로그인 필요, ADMIN → `/admin` |
| `/setup-account` | 로그인 필요 |
| `/login` | 이미 로그인 시 역할별 홈으로 리다이렉트 |

---

## 구현 현황

### 완료된 API

#### 인증
| 엔드포인트 | 설명 |
|-----------|------|
| `POST /join` | 일반 회원가입 (loginId/password/name/teamId/groupId) |
| `POST /api/auth/first-login` | 최초 로그인 (이름+전화, VIP 전용) |
| `POST /api/auth/login` | 일반 로그인 (JSON, loginId+password) |
| `POST /api/auth/setup-account` | 계정 설정 (최초 로그인 후 인증 상태에서) |
| `GET /api/me` | 현재 사용자 정보 (needsSetup, groupId 포함) |
| `POST /logout` | Spring Security 세션 종료 (200 반환) |

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
| `GET /api/competitions/active` | 활성 대회 목록 (ApiResponse 포맷) |
| `GET /api/competitions/active/battle` | 진행 중 대회 배틀 데이터 (팀전적/조기여/MVP/D-Day) |
| `GET /api/competitions/{id}/teams` | 대회별 팀 목록 (ApiResponse 포맷) |
| `GET /api/teams/{id}/groups` | 팀별 조 목록 (ApiResponse 포맷) |

#### 유저 — 기록
| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/records` | 기록+사진 업로드 (해시 중복감지, 속도검증) |
| `GET /api/records/my` | 내 기록 조회 |
| `GET /api/records/team/{teamId}` | 팀 기록 조회 (인증 불필요) |
| `GET /api/records/group/{groupId}` | 조 기록 조회 (인증 불필요) |

#### 유저 — 대시보드
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/me/dashboard` | 개인 대시보드 (기록 통계, 팀 순위, 최근 기록 5건) |

#### 랭킹 (인증 불필요)
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/ranking/teams` | 팀 랭킹 (`?competitionId=` 선택) |
| `GET /api/ranking/groups` | 조 랭킹 (`?competitionId=` 선택) |
| `GET /api/ranking/members` | 개인 랭킹 (`?competitionId=` 선택) |

#### 공지사항 (인증 불필요 조회 / 관리자 전용 쓰기)
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/notices` | 공지 목록 (고정글 우선, 최신순, ApiResponse 포맷) |
| `GET /api/notices/{id}` | 공지 단건 (본문 포함, ApiResponse 포맷) |
| `POST /api/admin/notices` | 공지 생성 (title, content, isPinned) |
| `PATCH /api/admin/notices/{id}` | 공지 수정 (부분 업데이트) |
| `DELETE /api/admin/notices/{id}` | 공지 삭제 |

### 미구현 (우선순위 순)
1. 관리자 회원 관리

---

## 대회 배틀 시스템 (`/competition` 페이지)

### 백엔드

`CompetitionBattleService` — 진행 중(PROCEEDING) 또는 준비 중(READY) 대회를 자동 선택해 배틀 데이터 반환.

**응답 DTO**: `CompetitionBattleResponse`
```json
{
  "competitionId": 1,
  "competitionName": "2024 봄 대회",
  "dDay": 10,
  "teams": [{ "teamId":1, "teamName":"A팀", "colorCode":"#E74C3C", "totalKm":120.5 }],
  "groupRankings": [{ "rank":1, "groupName":"1조", "teamName":"A팀", "teamColorCode":"#E74C3C",
                      "totalKm":45.2, "recordCount":12, "isTopContributor":true }],
  "todayMvp": { "memberId":3, "name":"홍길동", "teamName":"A팀", "teamColorCode":"#E74C3C",
                "groupName":"1조", "todayKm":8.5 }
}
```

**새로 추가된 JPQL 쿼리** (`RunningRecordRepository`):
- `getGroupContributionsByCompetition(competitionId)` — 조별 누적 거리 + 기록 수
- `findTodayMvpCandidates(competitionId, today, pageable)` — 오늘의 최다 거리 멤버

### 프론트엔드 (`app/competition/page.tsx`)

- **TeamBattleBar**: CSS 퍼센트 분할 애니메이션 바, 팀 컬러 반영
- **GroupRow**: 조별 기여 수평 바, 금/은/동 뱃지, 최고 기여 조에 선물 뱃지
- **DdayBadge**: D-Day 카운트다운
- **TodayMVP**: 오늘 최다 거리 멤버 강조 표시

---

## 러닝 기록 검증 (`RunningRecordService`)

업로드 시 두 가지 자동 검증:
1. SHA-256 사진 해시 → DB 중복 체크 (`existsByPhotoHash`)
2. 시속 = 거리 ÷ (duration/3600) → 45km/h 초과 시 거부

사진은 `file.upload.dir` (기본: `C:/running-photos/`) 에 UUID 파일명으로 저장, `/photos/**` 경로로 정적 서빙.

## Competition 상태 계산

`CompetitionStatus`(READY/PROCEEDING/FINISHED)는 DB 컬럼 없이 `startDate`, `endDate`, `isActive` 세 값으로 런타임 계산. `isActive=false`이면 강제 FINISHED.

## DB 설정

- **로컬**: H2 파일 DB (`~/runningdb`), `spring.jpa.hibernate.ddl-auto=update`로 스키마 자동 관리
- **운영**: PostgreSQL (Supabase), `application.properties` 상단 주석 처리된 블록을 활성화

운영 전환 시 `application.properties`에서 H2 블록을 주석 처리하고 PostgreSQL 블록을 해제.

⚠️ **운영 DB 마이그레이션 필수 사항** (최근 스키마 변경):
```sql
-- login_id NOT NULL 제약 해제
ALTER TABLE members ALTER COLUMN login_id DROP NOT NULL;
-- phone 컬럼 추가
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
```

## 모니터링

Prometheus 메트릭: `GET /actuator/prometheus`
