# Running Club - 러닝 대회 관리 시스템

Spring Boot 기반의 러닝 클럽 대회 관리 백엔드 API입니다.
관리자가 대회 및 팀/조를 구성하고, 사용자가 러닝 기록을 제출하면 관리자가 승인하는 구조입니다.

---

## 핵심 흐름

```
관리자: 대회 생성 → 팀(청팀/백팀) 구성 → 조(1조/2조) 구성
   ↓
사용자: 회원가입 시 팀/조 선택 → 러닝 기록 + 사진 업로드
   ↓
관리자: 기록 승인 / 반려 (사유 포함)
   ↓
공개: 팀별 · 조별 · 개인별 랭킹 조회 (전체 / 대회별 필터)
```

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Spring Boot 3.4.3 |
| Language | Java 17 |
| ORM | Spring Data JPA / Hibernate |
| DB | PostgreSQL (Supabase) / H2 (로컬 개발) |
| Security | Spring Security 6 + BCrypt (세션 기반) |
| Build | Maven |
| Monitoring | Spring Actuator + Prometheus |

---

## DB 구조

```
competitions
  └── teams (competition_id)
        └── running_groups (team_id)
              └── members (team_id, group_id)
                    └── running_records (member_id, competition_id)

notices (독립 테이블, author: String)
```

---

## API 목록 및 구현 현황

### 인증

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | POST | `/join` | 회원가입 (JSON body: loginId/password/name/teamId/groupId) |
| ✅ | POST | `/login` | 로그인 (Spring Security form-urlencoded) |

---

### 관리자 - 대회 세팅 (`ADMIN` 전용)

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | GET | `/api/admin/competitions` | 대회 목록 (팀 수 포함) |
| ✅ | POST | `/api/admin/competitions` | 대회 생성 |
| ✅ | PATCH | `/api/admin/competitions/{id}` | 대회 수정 / 상태 토글 (부분 업데이트) |
| ✅ | DELETE | `/api/admin/competitions/{id}` | 대회 삭제 (팀 존재 시 불가) |
| ✅ | GET | `/api/admin/competitions/{id}/teams` | 대회별 팀 목록 (조 수 포함) |
| ✅ | POST | `/api/admin/competitions/{id}/teams` | 팀 생성 |
| ✅ | PATCH | `/api/admin/teams/{id}` | 팀 수정 (부분 업데이트) |
| ✅ | DELETE | `/api/admin/teams/{id}` | 팀 삭제 (멤버 존재 시 불가, 조 Cascade 삭제) |
| ✅ | GET | `/api/admin/teams/{id}/groups` | 팀별 조 목록 |
| ✅ | POST | `/api/admin/teams/{id}/groups` | 조 생성 |
| ✅ | PATCH | `/api/admin/groups/{id}` | 조 수정 |
| ✅ | DELETE | `/api/admin/groups/{id}` | 조 삭제 (멤버 존재 시 불가) |

---

### 관리자 - 기록 승인/반려 (`ADMIN` 전용)

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | GET | `/api/admin/records/waiting` | 승인 대기 목록 |
| ✅ | PATCH | `/api/admin/records/{id}/approve` | 기록 승인 |
| ✅ | PATCH | `/api/admin/records/{id}/reject` | 기록 반려 (`?reason=사유`) |

---

### 회원가입 지원 조회 (PUBLIC, 인증 불필요)

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | GET | `/api/competitions/active` | 활성 대회 목록 (READY + PROCEEDING) |
| ✅ | GET | `/api/competitions/{id}/teams` | 대회 내 팀 목록 (종료 대회 400 차단) |
| ✅ | GET | `/api/teams/{id}/groups` | 팀 내 조 목록 |

---

### 기록 조회

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | POST | `/api/records` | 기록 + 사진 업로드 (인증 필요) |
| ✅ | GET | `/api/records/my` | 내 기록 조회 (인증 필요) |
| ✅ | GET | `/api/records/team/{teamId}` | 팀 기록 조회 (PUBLIC) |
| ✅ | GET | `/api/records/group/{groupId}` | 조 기록 조회 (PUBLIC) |

---

### 랭킹 (PUBLIC, 인증 불필요)

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | GET | `/api/ranking/teams` | 팀 랭킹 (전체 또는 `?competitionId={id}`) |
| ✅ | GET | `/api/ranking/groups` | 조 랭킹 (전체 또는 `?competitionId={id}`) |
| ✅ | GET | `/api/ranking/members` | 개인 랭킹 (전체 또는 `?competitionId={id}`) |

---

### 공지사항

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ❌ | GET | `/api/notices` | 공지 목록 (PUBLIC) |
| ❌ | GET | `/api/notices/{id}` | 공지 상세 (PUBLIC) |
| ❌ | POST | `/api/admin/notices` | 공지 작성 (ADMIN) |
| ❌ | PATCH | `/api/admin/notices/{id}` | 공지 수정 (ADMIN) |
| ❌ | DELETE | `/api/admin/notices/{id}` | 공지 삭제 (ADMIN) |

---

### 관리자 - 회원 관리

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ❌ | GET | `/api/admin/members` | 전체 회원 목록 |
| ❌ | PATCH | `/api/admin/members/{id}/role` | 권한 변경 (USER ↔ ADMIN) |
| ❌ | PATCH | `/api/admin/members/{id}/assignment` | 팀/조 재배정 |

---

## 주요 기능 상세

### 러닝 기록 검증 로직
- **중복 사진 방지**: 사진 파일의 SHA-256 해시를 DB에 저장하여 동일 사진 재업로드 차단
- **속도 검증**: 거리 ÷ 시간으로 시속을 계산하여 45km/h 초과 시 업로드 거부
- **승인 워크플로**: 업로드 → `WAITING` → 관리자 검토 → `APPROVED` / `REJECTED`
- **competition_id 자동 연결**: 업로드 시 member.team.competition 경로로 자동 도출

### 보안
- Spring Security 6 세션 기반 인증 (JSESSIONID 쿠키)
- 역할: `USER` (일반) / `ADMIN` (관리자) — `hasAuthority()` 사용 (ROLE_ 접두사 없음)
- `/api/admin/**` 는 ADMIN 권한만 접근 가능
- 회원가입 시 팀/조 cross-injection 방지 검증 (groupId가 해당 teamId 소속인지 확인)
- 사진 파일은 서버 로컬 저장 (`C:/running-photos/`) + UUID 파일명

### CORS
- `http://localhost:3000` (Next.js 개발 서버) 허용
- `allowCredentials: true` — 세션 쿠키 포함 요청 허용

### Competition 상태 계산
- `CompetitionStatus` (READY / PROCEEDING / FINISHED)는 DB 컬럼 없이 런타임 계산
- `isActive=false` 이면 강제 FINISHED

### 삭제 안전장치
- 대회 삭제: 소속 팀 존재 시 차단
- 팀 삭제: 소속 멤버 존재 시 차단 / 소속 조는 Cascade 자동 삭제
- 조 삭제: 소속 멤버 존재 시 차단

---

## 로컬 실행

```bash
# H2 파일 DB로 실행 (기본값)
cd running-club
./mvnw spring-boot:run

# H2 Console
http://localhost:8080/h2-console
JDBC URL: jdbc:h2:file:~/runningdb

# 관리자 계정 만들기
# 1. POST /join 으로 계정 생성
# 2. H2 Console: UPDATE members SET role='ADMIN' WHERE login_id='admin';
```

---

## 응답 포맷

공개 API (인증 불필요) 응답:
```json
{ "success": true,  "data": [...], "message": null }
{ "success": false, "data": null,  "message": "에러 메시지" }
```

관리자 API는 ResponseEntity 직접 반환.

---

## 모니터링

Prometheus 메트릭: `GET /actuator/prometheus`
