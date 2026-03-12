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
공개: 팀별 · 조별 · 개인별 랭킹 조회
```

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Spring Boot 3.4.3 |
| Language | Java 17 |
| ORM | Spring Data JPA / Hibernate |
| DB | PostgreSQL (Supabase) / H2 (로컬 개발) |
| Security | Spring Security + BCrypt |
| Build | Maven |
| Monitoring | Spring Actuator + Prometheus + Grafana |

---

## DB 구조

```
competitions
  └── teams (competition_id)
        └── running_groups (team_id)
              └── members (team_id, group_id)
                    └── running_records (member_id, competition_id)

notices (author_id → members.id)
```

---

## API 목록 및 구현 현황

### 인증

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | POST | `/join` | 회원가입 |
| ✅ | POST | `/login` | 로그인 (Spring Security) |
| ❌ | POST | `/logout` | 로그아웃 |

> **TODO:** 회원가입 시 `teamId`, `groupId` 선택 파라미터 추가 필요

---

### 관리자 - 대회 세팅 (`ADMIN` 전용)

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ❌ | POST | `/api/admin/competitions` | 대회 생성 |
| ❌ | GET | `/api/admin/competitions` | 대회 목록 |
| ❌ | PATCH | `/api/admin/competitions/{id}` | 대회 수정 (활성화 토글 등) |
| ❌ | DELETE | `/api/admin/competitions/{id}` | 대회 삭제 |
| ❌ | POST | `/api/admin/competitions/{id}/teams` | 팀 생성 |
| ❌ | PATCH | `/api/admin/teams/{id}` | 팀 수정 |
| ❌ | DELETE | `/api/admin/teams/{id}` | 팀 삭제 |
| ❌ | POST | `/api/admin/teams/{id}/groups` | 조 생성 |
| ❌ | PATCH | `/api/admin/groups/{id}` | 조 수정 |
| ❌ | DELETE | `/api/admin/groups/{id}` | 조 삭제 |

---

### 회원가입 지원 조회 (PUBLIC)

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ❌ | GET | `/api/competitions/active` | 활성 대회 목록 |
| ❌ | GET | `/api/competitions/{id}/teams` | 대회 내 팀 목록 |
| ❌ | GET | `/api/teams/{id}/groups` | 팀 내 조 목록 |

---

### 기록 업로드 (USER)

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | POST | `/api/records` | 기록 + 사진 업로드 |
| ✅ | GET | `/api/records/my` | 내 기록 조회 |
| ✅ | GET | `/api/records/team/{teamId}` | 팀 기록 조회 |
| ❌ | GET | `/api/records/group/{groupId}` | 조 기록 조회 |

---

### 관리자 - 기록 승인/반려 (`ADMIN` 전용)

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | GET | `/api/admin/records/waiting` | 승인 대기 목록 |
| ✅ | PATCH | `/api/admin/records/{id}/approve` | 기록 승인 |
| ✅ | PATCH | `/api/admin/records/{id}/reject` | 기록 반려 (사유 포함) |

---

### 랭킹 (PUBLIC)

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ✅ | GET | `/api/ranking/teams` | 전체 팀 랭킹 |
| ✅ | GET | `/api/ranking/groups` | 전체 조 랭킹 |
| ✅ | GET | `/api/ranking/members` | 전체 개인 랭킹 |
| ❌ | GET | `/api/ranking/competition/{id}/teams` | 특정 대회 팀 랭킹 |
| ❌ | GET | `/api/ranking/competition/{id}/members` | 특정 대회 개인 랭킹 |

---

### 공지사항

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ❌ | GET | `/api/notices` | 공지 목록 |
| ❌ | GET | `/api/notices/{id}` | 공지 상세 |
| ❌ | POST | `/api/admin/notices` | 공지 작성 |
| ❌ | PATCH | `/api/admin/notices/{id}` | 공지 수정 |
| ❌ | DELETE | `/api/admin/notices/{id}` | 공지 삭제 |

---

### 관리자 - 회원 관리

| 상태 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| ❌ | GET | `/api/admin/members` | 전체 회원 목록 |
| ❌ | PATCH | `/api/admin/members/{id}/role` | 권한 변경 (USER ↔ ADMIN) |
| ❌ | PATCH | `/api/admin/members/{id}/assignment` | 팀/조 재배정 |

---

## 구현 우선순위

```
1순위 🔴  관리자 대회 세팅 API (Competition → Team → Group)
          회원가입 지원 조회 API (active, teams, groups)
          → 이 두 가지가 없으면 회원가입 자체가 불가능

2순위 🟠  회원가입에 teamId / groupId 파라미터 추가
          Repository: Team, Competition, RunningGroup, Notice

3순위 🟡  조 기록 조회 (/api/records/group/{groupId})
          특정 대회 기준 랭킹 API

4순위 🟢  공지사항 CRUD
          관리자 회원관리 (권한 변경, 팀/조 재배정)

5순위 ⚪  Global Exception Handler
          로그아웃 엔드포인트
```

---

## 주요 기능 상세

### 러닝 기록 검증 로직
- **중복 사진 방지**: 사진 파일의 SHA-256 해시를 DB에 저장하여 동일 사진 재업로드 차단
- **속도 검증**: 거리 ÷ 시간으로 시속을 계산하여 45km/h 초과 시 업로드 거부
- **승인 워크플로**: 업로드 → WAITING → 관리자 검토 → APPROVED / REJECTED

### 보안
- Spring Security 기반 인증/인가
- 역할: `USER` (일반) / `ADMIN` (관리자)
- `/api/admin/**` 는 ADMIN 권한만 접근 가능
- 사진 파일은 서버 로컬 저장 (`C:/running-photos/`) + UUID 파일명

### 모니터링
- Spring Actuator + Prometheus로 JVM 지표 수집
- Grafana 대시보드로 실시간 시스템 관제
- 추적 항목: Heap/Thread 상태, API 응답시간, 부하 테스트 시 GC 동작

---

## 로컬 실행

```bash
# H2 파일 DB로 실행 (기본값)
./mvnw spring-boot:run

# H2 Console
http://localhost:8080/h2-console
JDBC URL: jdbc:h2:file:~/runningdb
```

### application.properties 주요 설정

```properties
file.upload.dir=C:/running-photos
spring.servlet.multipart.max-file-size=10MB
```
