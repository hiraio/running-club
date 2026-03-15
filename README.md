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

---

## 운영 인프라 구성 및 연결 원리

### 전체 구조

```
사용자 브라우저
     │  HTTPS
     ▼
┌─────────────────────────────┐
│  Vercel (프론트엔드)         │  Next.js 앱 빌드·배포
│  running-club-front/ 폴더   │  전 세계 CDN으로 서빙
└─────────────────────────────┘
     │
     │  HTTP API 요청
     │  (브라우저가 직접 백엔드로 요청)
     ▼
┌─────────────────────────────┐
│  Oracle Cloud VM (백엔드)   │  Public IP: 217.142.231.239
│  Spring Boot :8080          │  Ubuntu 22.04, Java 17
└─────────────────────────────┘
     │
     │  JDBC
     ▼
┌─────────────────────────────┐
│  Supabase PostgreSQL (DB)   │
└─────────────────────────────┘
```

### 연결 원리 상세

| 구간 | 방식 | 설명 |
|------|------|------|
| 브라우저 → Vercel | HTTPS | Vercel이 Next.js 앱을 CDN으로 서빙. 정적 파일과 라우팅을 담당 |
| 브라우저 → Oracle | HTTP API | API 요청은 브라우저가 직접 Oracle 서버로 보냄. Vercel을 거치지 않음 |
| 로그인 세션 유지 | Cookie | Spring Security가 로그인 시 JSESSIONID 쿠키 발급. 프론트는 `credentials: "include"` 옵션으로 모든 API 요청에 쿠키를 자동으로 포함시킴 |
| CORS 허용 | Spring WebConfig | 브라우저는 보안상 다른 출처(도메인)로의 API 요청을 기본 차단함. Oracle 서버의 `WebConfig`에서 Vercel 도메인을 허용 오리진으로 명시해야 API 호출이 가능 |
| 환경변수 주입 | Vercel ENV | 프론트 코드에서 `process.env.NEXT_PUBLIC_API_URL`로 백엔드 주소를 참조. Vercel 대시보드에 `NEXT_PUBLIC_API_URL=http://217.142.231.239:8080`으로 설정 |

### Vercel 배포 설정

모노레포 구조(백엔드 + 프론트가 한 레포)이기 때문에 Vercel에 Root Directory를 반드시 지정해야 함.

```
Vercel Import 설정
├── Root Directory : running-club-front   ← 필수. 미설정 시 404
├── Framework      : Next.js              ← Root Directory 설정 후 자동 감지
└── Environment Variables
    └── NEXT_PUBLIC_API_URL = http://217.142.231.239:8080
```

---

## 트러블슈팅

### 1. Uncaught SyntaxError: Invalid or unexpected token

**증상**
브라우저 콘솔에 SyntaxError가 뜨며 화면이 아무것도 표시되지 않음.

**원인**
`layout.tsx`에서 `next/font/google`(Inter 폰트)을 import할 때, Next.js의 Edge Runtime 환경에서 `__dirname is not defined` 에러가 발생함. 이로 인해 JS 청크 파일 로드 실패 → 브라우저가 오류 HTML 페이지를 JS로 파싱하려다 SyntaxError 발생.

**해결**
`layout.tsx`에서 `next/font/google` import 제거.

```tsx
// 삭제
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

// 변경 전
<body className={`${inter.className} min-h-screen bg-background text-foreground`}>

// 변경 후
<body className="min-h-screen bg-background text-foreground">
```

---

### 2. CORS 에러 — 401 응답에 Access-Control-Allow-Origin 헤더 없음

**증상**
```
Access to fetch at 'http://localhost:8080/api/me' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**원인**
Spring Security가 인증이 필요한 경로(`/api/me` 등)에서 401을 반환할 때, Spring MVC의 CORS 설정(`WebConfig.addCorsMappings`)이 적용되기 전에 Security 필터가 먼저 응답을 내보냄. 그 결과 CORS 헤더가 없는 채로 401이 반환되어 브라우저가 CORS 에러로 표시함.

**해결**
`SecurityConfig`에 `.cors(Customizer.withDefaults())` 한 줄 추가. 이렇게 하면 Spring Security 레이어에서도 `WebConfig`의 CORS 설정을 참조하여 에러 응답에도 CORS 헤더를 포함시킴.

```java
http.cors(Customizer.withDefaults())  // 이 줄 추가
    .csrf(csrf -> csrf.disable())
    ...
```

---

### 3. Vercel 배포 후 모든 URL 404

**증상**
Vercel 대시보드에서 빌드 상태가 Ready인데도 URL 접속 시 `NOT_FOUND` 404 반환.

**원인 A — Root Directory 미설정**
레포 루트에 Spring Boot + Next.js가 함께 있는 모노레포인데, Vercel이 루트에서 Next.js 앱을 찾지 못함.

**해결 A**
Vercel 프로젝트 Settings → General → Root Directory를 `running-club-front`로 지정.

**원인 B — v0.dev 프로젝트와 도메인 충돌**
`v0-running-club.vercel.app` 도메인이 v0.dev로 자동 생성된 별개의 Vercel 프로젝트에 연결되어 있어, 새로 배포한 프로젝트가 해당 도메인에 연결되지 않음.

**해결 B**
기존 Vercel 프로젝트 삭제 후 GitHub 레포에서 새로 Import. Import 시 아래 순서대로 설정:

1. Root Directory → `running-club-front` 입력 (프레임워크가 자동 감지됨)
2. Environment Variables → `NEXT_PUBLIC_API_URL = http://217.142.231.239:8080` 추가
3. Deploy

---

### 4. Oracle 서버 외부에서 접속 불가 (ERR_CONNECTION_REFUSED)

**증상**
`curl http://217.142.231.239:8080` 응답 없음 또는 연결 거부.

**원인 및 체크리스트**

```bash
# Spring Boot가 실행 중인지 확인
ps aux | grep java

# iptables에서 8080 포트가 열려있는지 확인
sudo iptables -L INPUT -n | grep 8080

# 포트 허용 추가 (REJECT 규칙 앞에 삽입해야 효과 있음)
sudo iptables -I INPUT 1 -p tcp --dport 8080 -j ACCEPT
```

> ⚠️ `iptables -A`(append) 로 추가하면 기존 REJECT 규칙 뒤에 붙어서 효과가 없음.
> 반드시 `-I`(insert) 로 앞에 삽입할 것.

Oracle Cloud 콘솔에서도 확인:
- VCN → Security Lists → Ingress Rules에 TCP 포트 8080 추가 여부
- Route Table에 인터넷 게이트웨이 Route Rule 추가 여부 (누락 시 SSH도 불가)
