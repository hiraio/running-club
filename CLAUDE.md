# CLAUDE.md

## Project Location

- 백엔드: `running-club/src/main/java/com/running/club/`
- 프론트엔드: `running-club-front/`

## Commands

```bash
cd running-club && ./mvnw spring-boot:run        # 백엔드 실행
cd running-club-front && npm run dev             # 프론트엔드 실행
# H2 Console: http://localhost:8080/h2-console  (JDBC URL: jdbc:h2:file:~/runningdb)
```

---

## 백엔드 아키텍처

### 도메인 계층
```
Competition → Team → RunningGroup → Member → RunningRecord
```

### 핵심 설계 규칙

- **Repository**: 모든 쿼리 `@Query` JPQL 명시. N+1 → `JOIN FETCH`, 대량 수정 → `@Modifying`
- **DTO**: 엔티티 직접 반환 금지. `XxxSummaryDTO` / `XxxResponse.from(entity)` / `XxxCreateRequest`
- **엔티티**: `@Getter`만. setter 없음. 변경은 도메인 메서드 + 더티체킹
- **트랜잭션**: Service에 `@Transactional(readOnly=true)` 기본, 쓰기만 `@Transactional` 오버라이드
- **공개 API 응답**: `ApiResponse<T>` 래퍼 (`{ success, data, message }`). 관리자/인증 API는 직접 반환
- **전역 예외**: `GlobalExceptionHandler` — `IllegalArgumentException` / `IllegalStateException` → 400

---

## 인증/보안 (중요)

### 로그인 방식

| 방식 | 엔드포인트 |
|------|-----------|
| 일반 로그인 | `POST /api/auth/login` (JSON: loginId+password) |
| 최초 로그인 | `POST /api/auth/first-login` (이름+전화 → 세션 저장만, DB 쓰기 없음) |
| 계정 설정 | `POST /api/auth/setup-account` (세션 또는 URL params fallback — candidate 소진 + member 생성 원자적 처리) |
| 내 정보 | `GET /api/me` |
| 로그아웃 | `POST /logout` → 200 반환 (302 redirect 방지) |

### 최초 로그인 플로우 (first_login_candidates)
```
first_login_candidates 테이블: id, name, phone, is_used, created_at
  ↓ firstLogin(): 이름+전화 검증 → 세션에 name/phone 저장 (DB 쓰기 없음)
  ↓ setupAccount(): 세션에서 name/phone 읽기 (없으면 request body fallback)
     → candidate.markUsed() + Member 생성 + loginId/pw 설정 (1 트랜잭션)
```
- 중간에 창 닫아도 is_used=false 유지 → 재시도 가능
- **모바일 대응**: 크로스도메인 쿠키 차단 시 세션 대신 URL params(name/phone)로 fallback
- Supabase SQL: `CREATE TABLE first_login_candidates (id BIGSERIAL PRIMARY KEY, name VARCHAR NOT NULL, phone VARCHAR(20) NOT NULL, is_used BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP DEFAULT NOW());`

### ⚠️ 주의사항

- **members.loginId**: 최초 로그인 사용자도 setupAccount 완료 후 NOT NULL. first_login_candidates에 있는 동안만 미생성
- **CustomUserDetails**: `getAuthorities()`는 `new SimpleGrantedAuthority(role)` — 람다 금지 (Serializable 미구현)
- **formLogin 병존**: JSON 로그인(`/api/auth/login`)과 form login(`/login`)이 공존 중. Postman 테스트 시 `Content-Type: application/json`
- **CORS**: `WebConfig` — `allowedOrigins` 환경변수화 (`${CORS_ALLOWED_ORIGIN}`), OPTIONS 전체 허용
- **CORS + 401 문제**: Spring Security가 401 반환 시 CORS 헤더 누락 → `SecurityConfig`에 `.cors(Customizer.withDefaults())` 필수

### SecurityConfig permitAll 경로
```
OPTIONS /**, /h2-console/**, /join, /login, /photos/**
/api/auth/first-login, /api/auth/login, /api/auth/setup-account
/api/records/team/**, /api/records/group/**, /api/records/recent
/api/ranking/**, /api/competitions/**, /api/teams/**
/api/notices/**
```

---

## DB 설정

- **로컬**: H2 파일 DB (`~/runningdb`), `ddl-auto=update`
- **운영**: PostgreSQL (Supabase) — `application-prod.properties`
- **`app.init-test-data=false`**: 재시작 시 데이터 유지. `true`로 바꾸면 전체 초기화 후 테스트 계정 생성
  - 테스트 계정: `admin/admin1234`, `user1~4/user1234`, VIP: 이름=VIP테스터 전화=010-9999-0001

---

## 프론트엔드 구조

### API 호출 아키텍처 (크로스도메인 쿠키 해결)

```
[클라이언트 컴포넌트] → api.ts (BASE="") → 같은 도메인 요청
     → Vercel rewrites (/api/* → nd-running-club.duckdns.org/api/*)
     → 백엔드 (쿠키 정상 동작, 3rd-party 쿠키 차단 우회)

[Server Component] → SERVER_API 변수로 백엔드 직접 호출
     → rewrites를 타지 않으므로 절대 URL 필수
```

- **클라이언트**: `lib/api.ts`의 `BASE`는 운영에서 빈 문자열 → 같은 도메인 요청 → Vercel rewrites가 프록시
- **서버**: `app/page.tsx` 등 Server Component는 `process.env.NEXT_PUBLIC_API_URL || "https://nd-running-club.duckdns.org"` 직접 호출
- **로컬**: `.env.local`에 `NEXT_PUBLIC_API_URL=http://localhost:8080` → rewrites 비활성, 직접 연결
- **사진 URL**: `resolvePhotoUrl()` 헬퍼가 상대경로(`/photos/...`)를 절대경로로 변환

### 주요 페이지
```
app/page.tsx              홈 — async Server Component. battleData 서버 fetch 후
                          순서: DynamicGreeting → BattleCard → ActivityFeed
                          READY 대회 → ComingSoonCard 표시
app/dashboard/            사용자 대시보드 (네비에서 "마이페이지"로 표시)
app/members/[id]/         다른 회원의 읽기 전용 대시보드
app/ranking/              랭킹 — 개인순위(전 기간 누적) → TeamBattleBar → 조별기여도
                          개인순위: competitionId 없이 호출 (전 기간)
                          팀/조 배틀: 대회 기간(startDate~endDate) 내 기록만 집계
                          READY 대회: "곧 시작" 안내 표시
app/competition/          대회 목록 + 상세
app/records/              기록 업로드 (분+초 분리 입력, 페이스 실시간 미리보기)
                          기록 추가 모달: max-h-[85vh] + overflow-y-auto (작은 화면 스크롤)
app/notices/[id]/         공지 상세 — react-markdown + remark-gfm 마크다운 렌더링
app/admin/                관리자 대시보드 (기록승인/대회관리/공지관리/회원관리)
app/admin/notices/        공지 관리 — 생성/수정/삭제 + 마크다운 미리보기 탭 (작성↔미리보기 토글)
app/admin/members/        회원 관리 — 팀·조 배정
```

### 엔디(Endi) 캐릭터
- 이미지 경로: `public/endi.png` — 이 파일만 교체하면 모든 페이지에 즉시 반영
- **투명 배경 PNG 권장** — 흰 배경이면 다크 테마에서 어색하게 보임
- 등장 위치: 홈/로그인/랭킹/기록/마이페이지
- **OG 이미지**: `app/opengraph-image.tsx` — 링크 공유 시 엔디 + ND Running Club 미리보기

### 랭킹 집계 규칙 (중요)

| 랭킹 유형 | 날짜 필터 | 이유 |
|-----------|----------|------|
| **개인 순위** | 없음 (전 기간) | 대회 시작 전부터 끝까지 누적 |
| **팀 배틀** | startDate~endDate | 대회 기간 내 기록만 |
| **조별 기여도** | startDate~endDate | 대회 기간 내 기록만 |

### 대회 상태별 UI

| 상태 | 홈 BattleCard | 랭킹 페이지 |
|------|--------------|------------|
| READY | ComingSoonCard (D-day 카운트다운) | "곧 시작" 안내 + 개인순위만 표시 |
| PROCEEDING | 팀 배틀 스코어보드 | 전체 표시 (개인+팀+조) |
| FINISHED | "대회 종료" | 데이터 유지 |

### AuthUser 타입
```ts
interface AuthUser {
  id: number; loginId: string | null; name: string;
  role: "USER" | "ADMIN"; needsSetup: boolean;
  groupId: number | null; groupName: string | null;
  teamId: number | null; teamName: string | null; teamColorCode: string | null;
}
```

### 인증 보호 (AuthGuard)

`middleware.ts` 삭제됨 — Vercel Edge Runtime에서 `__dirname is not defined` 에러 발생으로 제거.
대신 `components/AuthGuard.tsx` (클라이언트 컴포넌트)가 `layout.tsx`에서 모든 페이지를 감싸며 동일한 보호 로직 수행.

| 경로 | 조건 |
|------|------|
| `/login` | 로그인 상태 + needsSetup=true → `/setup-account`, 그 외 → 역할별 홈 |
| **그 외 모든 경로** | 로그인 필수 — 미인증 시 `/login` 리다이렉트 |
| `/admin/**` | ADMIN 필요, USER → `/dashboard` |
| ADMIN이 `/admin` 외 접근 | → `/admin` 리다이렉트 |

---

## 순위 스냅샷 (`rank_snapshots`)

랭킹 변동(▲/▼/NEW) 표시용. `RankScheduler` — 서버 시작 시 1회 + 매일 자정 KST 실행.
`rankChange = previousRank - currentRank` (양수=▲, 음수=▼, 0=유지, null=NEW)

---

## 구현된 API 목록

**인증**: `/join`, `/api/auth/login`, `/api/auth/first-login`, `/api/auth/setup-account`, `/api/me`, `/logout`

**관리자**: `/api/admin/competitions/**`, `/api/admin/teams/**`, `/api/admin/groups/**`, `/api/admin/records/{id}/approve|reject`, `/api/admin/notices/**` (POST 생성, PATCH 수정, DELETE 삭제), `/api/admin/members` (GET), `/api/admin/members/{id}/assign` (PATCH)

**공개**: `/api/competitions`, `/api/competitions/active`, `/api/competitions/active/battle`, `/api/competitions/{id}/teams`, `/api/teams/{id}/groups`, `/api/ranking/teams|groups|members`, `/api/records/team/**`, `/api/records/group/**`, `/api/records/recent`, `/api/notices/**`

**인증 필요**: `POST /api/records`, `GET /api/records/my`, `GET /api/me/dashboard`, `GET /api/me/profile`, `PUT /api/me/profile`

**멤버 프로필**: `GET /api/members/{id}/profile`, `GET /api/groups/{id}/members`

---

## 배포 주의사항
- **Vercel (프론트)**: git push 시 자동 배포
- **Oracle VM (백엔드)**: 수동 배포 필요 — git push만으로는 반영 안 됨, SSH 접속 후 재배포 필수
- 백엔드 변경 후 반드시 Oracle VM 재배포 확인할 것 (과거 날짜 필터 미반영 사고 있었음)

## 미구현
- first_login_candidates 관리 UI (현재 Supabase에서 직접 INSERT)

## 모니터링
`GET /actuator/prometheus`

---

## 운영 배포 현황

### 인프라 구성
| 역할 | 서비스 | 상태 |
|------|--------|------|
| 백엔드 | Oracle Cloud Always Free (VM.Standard.E2.1.Micro, ap-osaka-1) | **운영 중** (systemd) |
| 프론트엔드 | Vercel (https://running-club-iota.vercel.app) | **배포 완료** |
| DB | Supabase PostgreSQL | **운영 중** |
| 도메인 | DuckDNS (nd-running-club.duckdns.org) | 설정 완료 (217.142.231.239) |
| HTTPS | Let's Encrypt (Certbot + Nginx) | **설정 완료** |

### Vercel 배포 설정 (최신)

```
Vercel 설정
├── Root Directory : running-club-front
├── Framework      : Next.js (자동 감지)
└── Environment Variables
    └── NEXT_PUBLIC_API_URL = (삭제됨 — 빈 값)
    └── API_BACKEND_URL = https://nd-running-club.duckdns.org (선택, 없으면 하드코딩 폴백)
```

- `NEXT_PUBLIC_API_URL` 삭제 → 클라이언트 BASE="" → 같은 도메인 요청 → Vercel rewrites 프록시
- `next.config.mjs` rewrites: `/api/*`, `/logout`, `/join`, `/photos/*` → 백엔드로 프록시
- Server Component는 rewrites를 안 타므로 백엔드 URL 직접 사용 (하드코딩 폴백 있음)

### Oracle VM 접속 & 재배포

```bash
# SSH 접속
ssh -i C:/sshkey/ssh.key ubuntu@217.142.231.239

# 재배포
cd /opt/nd-running && git pull origin main
cd running-club && ./mvnw clean package -DskipTests -Pprod
sudo systemctl restart nd-running

# 로그 확인
sudo journalctl -u nd-running -f        # 실시간
sudo journalctl -u nd-running -n 100    # 최근 100줄
sudo journalctl -u nd-running --since today  # 오늘
```

### .env 파일 위치 (Oracle VM)
```
/opt/nd-running/.env
```
필요 환경변수:
```
DB_URL=jdbc:postgresql://...supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=...
CORS_ALLOWED_ORIGIN=https://running-club-iota.vercel.app
SPRING_PROFILES_ACTIVE=prod
```
