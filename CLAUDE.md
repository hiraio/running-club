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
| 최초 로그인 | `POST /api/auth/first-login` (이름+전화, VIP 전용) |
| 계정 설정 | `POST /api/auth/setup-account` (인증 세션 필요) |
| 내 정보 | `GET /api/me` |
| 로그아웃 | `POST /logout` → 200 반환 (302 redirect 방지) |

### ⚠️ 주의사항

- **loginId NULL 허용**: VIP 사용자는 loginId/password=null. `needsSetup=true`이면 `/setup-account` 강제 이동
- **CustomUserDetails**: `getAuthorities()`는 `new SimpleGrantedAuthority(role)` — 람다 금지 (Serializable 미구현)
- **formLogin 병존**: JSON 로그인(`/api/auth/login`)과 form login(`/login`)이 공존 중. Postman 테스트 시 `Content-Type: application/json`
- **CORS**: `WebConfig` — `allowedOrigins: http://localhost:3000`, OPTIONS 전체 허용
- **CORS + 401 문제**: Spring Security가 401 반환 시 CORS 헤더 누락 → `SecurityConfig`에 `.cors(Customizer.withDefaults())` 필수. 없으면 미인증 API 요청이 브라우저에서 CORS 에러로 표시됨

### SecurityConfig permitAll 경로
```
OPTIONS /**, /h2-console/**, /join, /login, /photos/**
/api/auth/first-login, /api/auth/login
/api/records/team/**, /api/records/group/**, /api/records/recent
/api/ranking/**, /api/competitions/**, /api/teams/**
/api/notices/**
```

---

## DB 설정

- **로컬**: H2 파일 DB (`~/runningdb`), `ddl-auto=update`
- **운영**: PostgreSQL (Supabase) — `application.properties` 상단 주석 블록 활성화
- **`app.init-test-data=false`**: 재시작 시 데이터 유지. `true`로 바꾸면 전체 초기화 후 테스트 계정 생성
  - 테스트 계정: `admin/admin1234`, `user1~4/user1234`, VIP: 이름=VIP테스터 전화=010-9999-0001

### 운영 DB 마이그레이션
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

## 프론트엔드 구조

### 주요 페이지
```
app/page.tsx              홈 — async Server Component. battleData 서버 fetch 후
                          순서: DynamicGreeting → BattleCard → ActivityFeed
                          배경색 bg-[#0c0d10], 섹션별 헤더 레이블 포함
app/dashboard/            사용자 대시보드 (네비에서 "마이페이지"로 표시)
                          레이아웃 순서: EndiSpeechBanner → 프로필 → 주간활동 → 이번학기목표
                                       → 팀대항전 → 조내기여도 → 내조멤버 → 최근기록
                          프로필 카드 우상단 Pencil 아이콘으로 항상 편집 가능
                          ProfileEditModal: 학교/전공/자기소개/목표거리 통합 편집
                          "프로필을 완성해보세요" 온보딩 버튼은 비어있을 때만 표시
                          "내 조 멤버" 섹션: getGroupMembers(groupId) 호출,
                          멤버 이름 클릭 → /members/{id}
app/members/[id]/         다른 회원의 읽기 전용 대시보드 (인스타 프로필 느낌)
                          getMemberPublicProfile(id) — 프로필/통계/최근기록 5건
                          편집 버튼 없음. 목표 미설정 시 "목표 설정하기" 버튼 미표시
                          네비게이션 없음 — 모바일: MobileTopBar 뒤로가기만
                          데스크탑: 페이지 내 "← 뒤로가기" 버튼만
app/competition/          대회 목록 (PROCEEDING/READY/FINISHED 그룹)
                          각 카드 → /competition/[id] 상세 페이지
app/competition/[id]/     대회 상세 — 팀 목록(비종료 대회만), 랭킹 바로가기(진행중)
app/ranking/              랭킹 — 탭 없이 수직 구조:
                          개인순위(전체, 더보기 expand, "나" badge) →
                          TeamBattleBar → 조별기여도
                          rankChange: 활성 대회 ID 먼저 조회 후 getMemberRanking(id)
                          이름 클릭(남) → /members/{id}, 이름 클릭(나) → /dashboard
                          조 기여도 카드 (n명) 클릭 → GroupMembersSheet
app/notices/              공지사항 (공개)
app/admin/                관리자 (기록승인/대회관리/공지관리)
app/admin/history/        승인 히스토리 — 날짜범위/이름/상태 필터, 요약 4카드
                          테이블 클릭 → 상세 모달(사진 포함), 클라이언트 페이지네이션 20건/페이지

components/
  MobileTopBar.tsx        모바일 전용 상단 고정 바 (md:hidden, h-12, z-50)
                          좌: 서브페이지만 ArrowLeft 뒤로가기
                          중: 경로별 페이지 제목
                          우: 팀컬러 아바타 → /dashboard
                          서브페이지: /competition/*, /notices/*, /members/*
                          backTo="__back__" → router.back() (히스토리 기반)
  GroupMembersSheet.tsx   조 멤버 목록 우측 Sheet (shadcn)
                          getGroupMembers(groupId) 호출, 멤버 클릭 → /members/{id}
                          "나" badge 표시, 본인 클릭도 /members/{id} 이동
  DynamicGreeting.tsx     홈 전용 엔디 캐릭터 — 대시보드 API 기반 개인화 메시지
                          float(y) + click shake(rotate) + AnimatePresence 말풍선
                          팀배정/대회상태/개인순위/오늘 달린 여부 따라 메시지 분기
  EndiSpeechBanner.tsx    범용 엔디 배너 — messages[] + teamColor prop
                          랭킹/내기록/마이페이지 상단에 배치, 4초 순환
  WeeklyActivityCard.tsx  주간 바 차트 (recharts). initialRecords prop 있으면 fetch 스킵
                          오늘 날짜 하이라이트, 일일목표 ReferenceLine, 커스텀 툴팁
  MyContributionCard.tsx  조 내 기여도 카드 — groupMembers prop 재사용(추가 API 없음)
                          내 km / 조 내 순위 / 기여% / 미니 바차트 / 순위 상승 긴장감 메시지
  BattleCard.tsx          data: CompetitionBattle | null prop (자체 fetch 없음)
  ActivityFeed.tsx        최근 활동 피드 (3개씩 슬라이더, 스와이프 지원)
  ProfileEditModal.tsx    PUT /api/me/profile 호출, 저장 후 대시보드 리프레시
  GoalProgressRing.tsx    onSetGoal prop 선택. 없으면 "목표 설정하기" 버튼 미표시
  NavigationWrapper.tsx   네비게이션 레이어 관리
                          MINIMAL_NAV_PATTERNS(/members/*): MobileTopBar만, 사이드바 없음
                          ContentWrapper: 경로별 padding 자동 결정
  UserSidebar.tsx         모바일 하단 4개 탭: 홈/랭킹/내기록/마이페이지
                          더보기(Sheet): 대회현황/공지사항/로그아웃
```

### 엔디(Endi) 캐릭터
- 이미지 경로: `public/endi.png` — 이 파일만 교체하면 모든 페이지에 즉시 반영
- 파일 없으면 이미지 숨기고 말풍선만 표시 (onError 처리)
- **투명 배경 PNG 권장** — 흰 배경이면 다크 테마에서 어색하게 보임 (remove.bg 활용)
- 등장 위치:
  - 홈(`/`): `DynamicGreeting` — 대시보드 데이터 기반 다중 메시지, 4초 순환, 클릭 shake
  - 로그인(`/login`): 인사 + 모드/로딩 상태별 메시지 전환
  - 랭킹/기록/마이페이지: `EndiSpeechBanner` — 페이지별 고정 메시지 3개 순환

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
| `/login` | 로그인 상태면 역할별 홈으로 리다이렉트 |
| **그 외 모든 경로** | 로그인 필수 — 미인증 시 `/login` 리다이렉트 |
| `/admin/**` | ADMIN 필요, USER → `/dashboard` |
| ADMIN이 `/admin` 외 접근 | → `/admin` 리다이렉트 |

- 로딩 중에는 스피너 표시 (flash 방지)
- `/join` 회원가입: 링크 제거 + AuthGuard로 직접 URL 접근도 차단

---

## 순위 스냅샷 (`rank_snapshots`)

랭킹 변동(▲/▼/NEW) 표시용. `RankScheduler` — 서버 시작 시 1회 + 매일 자정 KST 실행.
`rankChange = previousRank - currentRank` (양수=▲, 음수=▼, 0=유지, null=NEW)
적용: 개인랭킹·조랭킹(competitionId 지정 시), 조별기여도(항상)

---

## 구현된 API 목록

**인증**: `/join`, `/api/auth/login`, `/api/auth/first-login`, `/api/auth/setup-account`, `/api/me`, `/logout`

**관리자**: `/api/admin/competitions/**`, `/api/admin/teams/**`, `/api/admin/groups/**`, `/api/admin/records/{id}/approve|reject`, `/api/admin/notices/**`

**공개**: `/api/competitions` (전체 목록), `/api/competitions/active`, `/api/competitions/active/battle`, `/api/competitions/{id}/teams`, `/api/teams/{id}/groups`, `/api/ranking/teams|groups|members`, `/api/records/team/**`, `/api/records/group/**`, `/api/records/recent`, `/api/notices/**`

**인증 필요**: `POST /api/records`, `GET /api/records/my`, `GET /api/me/dashboard` (ranToday 포함)

**관리자 히스토리**: `GET /api/admin/records/history` → `List<AdminHistoryDTO>` (APPROVED+REJECTED, createdAt DESC)
- `AdminHistoryDTO`: id, distance, duration, runningDate, status, photoUrl, comment, createdAt, userName, teamName, groupName, approvedByName, rejectedReason
- `findHistory()` 쿼리: `LEFT JOIN FETCH r.approvedBy` (LazyInit 방지)

**프로필**: `GET /api/me/profile`, `PUT /api/me/profile` (school, major, bio, targetDistance, profileImageUrl — 부분 업데이트)

**멤버 공개 프로필 (로그인 필요)**:
- `GET /api/members/{id}/profile` → `MemberPublicProfileResponse` (loginId/phone 미포함, recentRecords 5건 포함)
- `GET /api/groups/{id}/members` → `List<GroupMemberDTO>` (totalDistance DESC 정렬, 전체 랭킹 1회 조회로 N+1 방지)

---

## 미구현
- 관리자 회원 관리

## 모니터링
`GET /actuator/prometheus`

---

## 운영 배포 현황

### 인프라 구성
| 역할 | 서비스 | 상태 |
|------|--------|------|
| 백엔드 | Oracle Cloud Always Free (VM.Standard.E2.1.Micro, ap-osaka-1) | 세팅 중 |
| 프론트엔드 | Vercel | **배포 완료** |
| DB | Supabase PostgreSQL | 스키마 완료 |
| 도메인 | DuckDNS (nd-running.duckdns.org) | 미설정 |
| HTTPS | Let's Encrypt (Certbot + Nginx) | 미설정 |

### Oracle VM 정보
- **Public IP**: 217.142.231.239
- **Private IP**: 10.0.0.59
- **인스턴스명**: instance-20260315-1319
- **OS**: Ubuntu 22.04.5 LTS
- **SSH 키**: `C:\sshkey\ssh.key` (메인PC) / `~/ssh.key` (Cloud Shell)
- **SSH 유저**: ubuntu

### 운영 환경 코드 수정 완료 항목
1. `application-prod.properties` — DB/CORS/파일경로/세션쿠키 env var 기반 설정
2. `WebConfig.java` — CORS allowedOrigin 환경변수화 (`${CORS_ALLOWED_ORIGIN}`)
3. `RunningRecordService.java` — 사진 URL에 `server.base-url` prefix 추가 (크로스도메인 사진 로드 해결)
4. `application-prod.properties` — `SameSite=None; Secure` 세션쿠키 설정 (크로스도메인 로그인 해결)

### Oracle VM SSH 접속 방법
```bash
# 메인PC / 노트북 (SSH config 설정 시)
ssh nd-running

# 직접 접속
ssh -i C:/sshkey/ssh.key ubuntu@217.142.231.239

# Oracle Cloud Shell (브라우저 터미널) → 내부IP 사용
ssh -i ~/ssh.key ubuntu@10.0.0.59
```

> ⚠️ 기숙사 LAN에서는 포트 22 차단됨 → 핫스팟 사용 필요
> iptables 설정 전에는 외부에서 SSH 불가 → Oracle Cloud Shell로 우회

### Vercel 배포 설정 (완료)

모노레포 구조이므로 Import 시 반드시 아래 순서대로 설정:
1. Root Directory → `running-club-front` 먼저 입력 (입력 후 Next.js 자동 감지됨)
2. Environment Variables → `NEXT_PUBLIC_API_URL = http://217.142.231.239:8080`

> ⚠️ Root Directory 미설정 시 Vercel이 레포 루트를 빌드하려다 Next.js 감지 실패 → 404
> ⚠️ `next/font/google` import 금지 — Edge Runtime에서 `__dirname is not defined` 에러 발생 → JS 청크 로드 실패 → SyntaxError

### Oracle VM 세팅 남은 순서
```
1. Cloud Shell → SSH(내부IP) → iptables 열기 (22/80/443/8080)
2. Java 17 설치
3. git clone + mvn build (prod 프로필)
4. .env 파일 작성 (DB_URL, DB_USERNAME, DB_PASSWORD, CORS_ALLOWED_ORIGIN)
5. systemd 서비스 등록
6. DuckDNS 도메인 설정
7. Nginx 설치 + 리버스 프록시
8. Certbot HTTPS
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
CORS_ALLOWED_ORIGIN=https://[vercel-domain].vercel.app
SPRING_PROFILES_ACTIVE=prod
```

---

## 테스트 데이터 (H2 SQL 시나리오)

> H2 콘솔(`http://localhost:8080/h2-console`)에서 아래 순서대로 실행.
> `app.init-test-data=false` 상태에서 사용.

### 실행 순서
| Step | 내용 | 비고 |
|------|------|------|
| 1 | TRUNCATE 전체 + 시퀀스 리셋 | FK 역순, 반드시 먼저 |
| 2 | 대회(2건) + 팀(4건) + 조(12건) | |
| 3 | 유저 33명 (BCrypt 포함) | |
| 4 | 과거 대회 기록 217건 (comp_id=1, 전원 APPROVED) | record id 1~217 |
| 5 | 현재 대회 기록 45건 (comp_id=2) | record id 218~262 |
| 6 | 랭킹 스냅샷 26건 + 활동 피드 기록 10건 | snapshot id 1~26, record id 263~272 |

### 시나리오 요약
- **대회**: `신년 맞이 러닝 챌린지` (comp_id=1, 종료) / `제1회 ND-RUNNING 청백전` (comp_id=2, 진행 중)
- **팀**: 청팀(team_id=3) / 백팀(team_id=4), 각 3개 조 (group_id 7~12)
- **특수 유저**:
  - `admin` / admin1234 — ADMIN, member_id=1
  - `kimcs` / user1234 — 김철수, 랭킹 빌런 (comp_id=2 개인 52km APPROVED), member_id=2
  - `leeyh` / user1234 — 이영희, 청팀 에이스, member_id=3
  - VIP테스터 (010-9999-0001) — loginId=NULL 최초로그인, member_id=33
- **치열한 접전**: 청팀1조(group_id=7) 비-김철수 APPROVED 합계 17.50km vs 백팀2조(group_id=11) 17.10km
- **상태 비율**: APPROVED 80% / WAITING 16% / REJECTED 4%
- **순위 변동**: ▲ 5명 / ▼ 5명 / 유지 10명 (rank_snapshots, snapshot_date=2026-03-13)
- **비밀번호 해시**: user1234 → `$2a$10$HI60OP8RuhrDcqwbOm1ZWeq4t5x1H78fEIRwOsoQE6EUY0C5GPQpe`
