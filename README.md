# ND-RUNNING — 러닝 클럽 대회 관리 시스템

팀을 나눠 달리기 대회를 진행하는 러닝 클럽을 위한 풀스택 웹 애플리케이션.
관리자가 대회·팀·조를 구성하고, 회원들이 러닝 기록을 제출하면 관리자가 승인하는 구조.
실시간 팀 배틀 현황, 조별 기여도, 개인 랭킹을 제공하며 회원끼리 서로의 프로필을 조회할 수 있음.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Spring Boot 3.4, Java 17, Spring Data JPA, Spring Security 6 |
| DB | H2 (로컬) / PostgreSQL Supabase (운영) |
| 인증 | 세션 기반 (JSESSIONID 쿠키) + BCrypt |
| 모니터링 | Spring Actuator + Prometheus |

---

## 로컬 실행

```bash
# 백엔드 (http://localhost:8080)
cd running-club && ./mvnw spring-boot:run

# 프론트엔드 (http://localhost:3000)
cd running-club-front && npm run dev

# H2 콘솔 (로컬 DB 조회)
http://localhost:8080/h2-console
JDBC URL: jdbc:h2:file:~/runningdb
```

**테스트 계정**
| 계정 | 비밀번호 | 역할 |
|------|----------|------|
| admin | admin1234 | 관리자 |
| user1 ~ user4 | user1234 | 일반 |
| 이름: VIP테스터 / 전화: 010-9999-0001 | — | VIP (최초 로그인) |

---

## 핵심 흐름

```
관리자: 대회 생성 → 팀(청팀/백팀) 구성 → 조(1조/2조/3조) 구성
   ↓
사용자: 회원가입 시 조 선택 (팀/대회 자동 귀속) → 러닝 기록 + 사진 업로드
   ↓
관리자: 기록 승인 / 반려 (사유 포함)
   ↓
공개: 팀 배틀 현황 · 조별 기여도 · 개인 랭킹 (순위 변동 ▲▼ 포함)
   ↓
회원: 다른 사람 이름 클릭 → 프로필 페이지 (기록·통계·자기소개)
```

---

## 주요 기능

### 대회 관리
- 관리자가 대회 생성 → 팀 → 조 순서로 구성
- 대회 상태 자동 계산: `READY` / `PROCEEDING` / `FINISHED` (DB 컬럼 없이 런타임)
- 진행 중인 대회의 팀 배틀 현황 실시간 표시

### 러닝 기록
- 사진 + 거리/시간 업로드 → WAITING 상태로 대기
- **중복 사진 방지**: SHA-256 해시 비교
- **속도 검증**: 45km/h 초과 시 업로드 거부
- 관리자 승인(APPROVED) 후 랭킹에 반영

### 랭킹 & 배틀
- 팀 랭킹 · 조별 기여도 · 개인 순위 (전체 / 대회별 필터)
- **순위 변동** (▲▼NEW): `rank_snapshots` 테이블, 매일 자정 KST 스케줄러 갱신
- 팀 배틀 진행률 바 + D-Day + 기여도 1위 조 하이라이트

### 멤버 프로필 조회
- 랭킹 이름 클릭 → `/members/{id}` 풀페이지 (인스타 프로필 느낌)
- 표시 내용: 이름/팀/조/학교/전공/자기소개 + 달리기 통계 + 최근 기록 5건
- 조 기여도 카드 **(n명)** 클릭 → 조 멤버 목록 Sheet → 멤버 클릭 → 프로필 페이지
- 대시보드 "내 조 멤버" 섹션에서도 동일하게 진입 가능
- 본인 클릭은 `/dashboard` 이동, 다른 사람 페이지에서는 편집 불가

### 사용자 대시보드
- 목표 거리 설정 + 원형 진행 링 (GoalProgressRing)
- **주간 활동 바 차트**: 요일별 km 시각화 (recharts), 오늘 하이라이트, 일일 목표 기준선
- **조 내 기여도 카드**: 내 km / 조 내 순위 / 기여% / 조원 비교 미니 차트
- 팀 대항전 카드 (내 기여도 %)
- 내 조 멤버 목록 (km 순 정렬, 이름 클릭 → 프로필)
- 프로필 편집 모달 (학교/전공/자기소개/목표거리)

### 관리자 승인 히스토리
- `/admin/history`: 처리 완료(승인/반려) 기록 전체 조회
- 필터: 날짜 범위 / 이름 검색 / 상태
- 요약 카드(4종) + 테이블 클릭 → 상세 모달(사진 포함)
- 클라이언트 페이지네이션 (20건/페이지)

### 엔디(Endi) 마스코트
- 사이트 마스코트 `public/endi.png` — 파일 교체만으로 전체 반영
- 홈: `DynamicGreeting` — 대시보드 데이터 기반 개인화 메시지, 4초 자동 순환, 클릭 shake 애니메이션
- 로그인: 모드(일반/최초/로딩)에 따라 말풍선 메시지 전환
- 랭킹 · 내 기록 · 마이페이지: 페이지 상단 `EndiSpeechBanner` 배치

### VIP 최초 로그인
- 관리자가 미리 등록한 VIP 사용자: 이름+전화로 인증 → loginId/password 설정
- 회원가입(`/join`) 페이지는 비활성화 — 로그인 없이 접근 시 로그인 페이지로 리다이렉트

---

## 페이지 구조

```
/                   홈 (팀 배틀 현황 + 활동 피드 + 응원 멘트)
/dashboard          내 마이페이지 (편집 가능)
/members/[id]       다른 사람 마이페이지 (읽기 전용, 네비 없음)
/ranking            랭킹 (개인 → 팀 배틀 → 조별 기여도)
/competition        대회 목록
/competition/[id]   대회 상세 (팀 목록 · 랭킹 링크)
/records            내 기록 업로드 · 조회
/notices            공지사항
/admin/**           관리자 전용
```

---

## API 목록

### 인증
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/join` | 회원가입 (groupId → 팀/대회 자동 귀속) | 불필요 |
| POST | `/api/auth/login` | 로그인 (JSON) | 불필요 |
| POST | `/api/auth/first-login` | VIP 최초 로그인 (이름+전화) | 불필요 |
| POST | `/api/auth/setup-account` | 계정 설정 (loginId+password 등록) | 세션 |
| GET | `/api/me` | 내 정보 | 필요 |
| POST | `/logout` | 로그아웃 (200 반환) | 필요 |

### 내 프로필 & 대시보드
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/me/dashboard` | 대시보드 통합 데이터 (프로필+통계+기록) | 필요 |
| GET | `/api/me/profile` | 내 프로필 조회 | 필요 |
| PUT | `/api/me/profile` | 프로필 수정 (부분 업데이트) | 필요 |

### 멤버 공개 프로필
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/members/{id}/profile` | 특정 회원 프로필 + 최근기록 5건 | 필요 |
| GET | `/api/groups/{id}/members` | 조 멤버 목록 + 통계 (km DESC 정렬) | 필요 |

### 공개 조회
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/competitions` | 전체 대회 목록 |
| GET | `/api/competitions/active` | 활성 대회 (READY+PROCEEDING) |
| GET | `/api/competitions/active/battle` | 팀 배틀 현황 (기여도+MVP) |
| GET | `/api/competitions/{id}/teams` | 대회 내 팀 목록 |
| GET | `/api/competitions/{id}/groups` | 대회 내 전체 조 목록 |
| GET | `/api/teams/{id}/groups` | 팀 내 조 목록 |
| GET | `/api/ranking/teams` | 팀 랭킹 (`?competitionId=` 선택) |
| GET | `/api/ranking/groups` | 조 랭킹 (`?competitionId=` 선택) |
| GET | `/api/ranking/members` | 개인 랭킹 (`?competitionId=` 선택) |
| GET | `/api/records/team/{id}` | 팀 기록 |
| GET | `/api/records/group/{id}` | 조 기록 |
| GET | `/api/records/recent` | 최신 활동 피드 |
| GET | `/api/notices` | 공지사항 목록 |
| GET | `/api/notices/{id}` | 공지 상세 |

### 기록 (로그인 필요)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/records` | 기록 + 사진 업로드 (multipart) |
| GET | `/api/records/my` | 내 기록 조회 |

### 관리자 전용
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET/POST | `/api/admin/competitions` | 대회 목록/생성 |
| PATCH/DELETE | `/api/admin/competitions/{id}` | 대회 수정/삭제 |
| GET/POST | `/api/admin/competitions/{id}/teams` | 팀 목록/생성 |
| PATCH/DELETE | `/api/admin/teams/{id}` | 팀 수정/삭제 |
| GET/POST | `/api/admin/teams/{id}/groups` | 조 목록/생성 |
| PATCH/DELETE | `/api/admin/groups/{id}` | 조 수정/삭제 |
| GET | `/api/admin/records/waiting` | 승인 대기 기록 |
| GET | `/api/admin/records/history` | 승인/반려 완료 기록 전체 |
| PATCH | `/api/admin/records/{id}/approve` | 기록 승인 |
| PATCH | `/api/admin/records/{id}/reject` | 기록 반려 (`?reason=`) |
| GET/POST | `/api/admin/notices` | 공지 목록/생성 |
| PATCH/DELETE | `/api/admin/notices/{id}` | 공지 수정/삭제 |

---

## DB 구조

```
competitions
  └── teams (competition_id)
        └── running_groups (team_id)
              └── members (team_id, group_id)
                    ├── member_profiles (member_id 1:1)
                    └── running_records (member_id, competition_id)

rank_snapshots (entity_type, entity_id, competition_id, rank, snapshot_date)
notices (독립 테이블)
```

### 운영 DB 마이그레이션 (Supabase PostgreSQL)
```sql
ALTER TABLE members ALTER COLUMN login_id DROP NOT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
CREATE TABLE IF NOT EXISTS rank_snapshots (
    id BIGSERIAL PRIMARY KEY, entity_type VARCHAR(20) NOT NULL,
    entity_id INT NOT NULL, competition_id BIGINT NOT NULL REFERENCES competitions(id),
    rank INT NOT NULL, snapshot_date DATE NOT NULL,
    UNIQUE (entity_type, entity_id, competition_id, snapshot_date)
);
```

---

## 응답 포맷

공개 API (인증 불필요):
```json
{ "success": true,  "data": [...], "message": null }
{ "success": false, "data": null,  "message": "에러 메시지" }
```
관리자/인증 API는 데이터 직접 반환 (래퍼 없음).

---

## 모니터링

```
GET /actuator/prometheus
```

---

## 접근 제어

로그인하지 않으면 `/login` 외 모든 페이지 접근 불가 (Next.js 미들웨어).

| 경로 | 접근 조건 |
|------|----------|
| `/login` | 누구나 (로그인 상태면 홈으로 리다이렉트) |
| 그 외 모든 경로 | 로그인 필수 |
| `/admin/**` | ADMIN 전용 |

---

## 미구현
- 관리자 회원 관리 (목록 조회 / 역할 변경 / 팀·조 재배정)
