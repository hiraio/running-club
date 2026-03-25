# ND-RUNNING — 러닝 클럽 대회 관리 시스템

팀을 나눠 달리기 대회를 진행하는 러닝 클럽을 위한 풀스택 웹 애플리케이션.
관리자가 대회·팀·조를 구성하고, 회원들이 러닝 기록을 제출하면 관리자가 승인하는 구조.
실시간 팀 배틀 현황, 조별 기여도, 개인 랭킹을 제공합니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS + Typography, shadcn/ui, Framer Motion |
| Backend | Spring Boot 3.4, Java 17, Spring Data JPA, Spring Security 6 |
| DB | H2 (로컬) / PostgreSQL Supabase (운영) |
| 인증 | 세션 기반 (JSESSIONID 쿠키) + BCrypt |
| 인프라 | Oracle Cloud VM + Vercel + Supabase + DuckDNS + Let's Encrypt |

---

## 운영 인프라 구조

```
사용자 브라우저 (모바일/PC)
     │  HTTPS
     ▼
┌──────────────────────────────────┐
│  Vercel (프론트엔드)              │  Next.js CDN 서빙
│  running-club-iota.vercel.app    │
│                                  │
│  rewrites: /api/* → 백엔드       │  ← 모바일 쿠키 차단 우회
│            /photos/* → 백엔드     │
└──────────────────────────────────┘
     │  서버→서버 프록시
     ▼
┌──────────────────────────────────┐
│  Oracle Cloud VM (백엔드)         │  Ubuntu 22.04, Java 17
│  nd-running-club.duckdns.org     │  Nginx (HTTPS) → Spring Boot :8080
│  /photos/ — Nginx static alias   │
└──────────────────────────────────┘
     │  JDBC
     ▼
┌──────────────────────────────────┐
│  Supabase PostgreSQL (DB)         │
└──────────────────────────────────┘
```

**핵심 포인트**: Vercel rewrites를 통해 API 요청이 같은 도메인으로 프록시됩니다. 이는 모바일 Chrome이 3rd-party 쿠키를 차단하는 문제를 근본적으로 해결합니다.

---

## 로컬 실행

```bash
# 백엔드 (http://localhost:8080)
cd running-club && ./mvnw spring-boot:run

# 프론트엔드 (http://localhost:3000)
cd running-club-front && npm run dev
```

---

## 핵심 흐름

```
관리자: 대회 생성 → 팀(청팀/백팀) 구성 → 조(1조/2조/3조) 구성
   ↓
관리자: first_login_candidates에 회원 등록 (이름+전화)
   ↓
사용자: 이름+전화로 최초 로그인 → loginId/password 설정 → 프로필 입력
   ↓
관리자: 회원 관리에서 팀·조 배정
   ↓
사용자: 러닝 기록 + 사진 업로드
   ↓
관리자: 기록 승인 / 반려 (사유 포함)
   ↓
공개: 팀 배틀 현황 · 조별 기여도 · 개인 랭킹 (순위 변동 ▲▼ 포함)
```

---

## 주요 기능

### 대회 관리
- 대회 상태 자동 계산: `READY` / `PROCEEDING` / `FINISHED` (날짜 기반 런타임)
- 팀/조 배틀은 **대회 기간(startDate~endDate) 내 기록만** 집계
- 개인 순위는 **전 기간 누적** (대회와 무관하게 항상 표시)

### 러닝 기록
- 사진 + 거리/시간 업로드 (분+초 분리 입력, 실시간 페이스 미리보기)
- **모바일 최적화**: 기록 추가 모달이 하단 시트로 표시, 폼 스크롤 + 제출 버튼 고정
- **중복 사진 방지**: SHA-256 해시 비교
- **속도 검증**: 45km/h 초과 시 업로드 거부
- 관리자 승인(APPROVED) 후 랭킹에 반영
- **활동 피드**: 승인 시각(`verifiedAt`) 기준 최신순 정렬 — 승인 즉시 피드에 노출

### 랭킹 & 배틀
- 팀 랭킹 · 조별 기여도 · 개인 순위
- **순위 변동** (▲▼NEW): `rank_snapshots` 테이블, 매일 자정 KST 갱신
- **이번 주 급성장**: 양수 성장률만 표시 (정수%), 이번 주 > 지난 주인 사람만
- READY 대회: "곧 시작" 안내 + D-day 카운트다운
- PROCEEDING 대회: 팀 배틀 스코어보드 + 기여도 차트

### 멤버 프로필
- 이름 클릭 → `/members/{id}` 프로필 페이지 (통계 + 최근 기록 5건)
- 조 기여도 카드 클릭 → 조 멤버 목록 Sheet

### 엔디(Endi) 마스코트
- `public/endi.png` 교체만으로 전체 반영
- 홈/로그인/랭킹/기록/마이페이지에 등장
- 링크 공유 시 OG 이미지에 엔디 포함 (`app/opengraph-image.tsx`)

### VIP 최초 로그인
- 관리자가 미리 등록 (Supabase `first_login_candidates` 테이블)
- 이름+전화로 인증 → loginId/password 설정 → 프로필 입력 (2단계)

---

## 페이지 구조

```
/                   홈 (배틀 카드 + 활동 피드 + 엔디 인사)
/dashboard          내 마이페이지 (편집 가능)
/members/[id]       다른 사람 마이페이지 (읽기 전용)
/ranking            랭킹 (개인 → 팀 배틀 → 조별 기여도)
/competition        대회 목록
/competition/[id]   대회 상세 (팀 목록 · 랭킹 링크)
/records            기록 업로드
/my-records         내 기록 조회
/notices            공지사항
/login              로그인 (일반 + 최초 로그인)
/setup-account      계정 설정 (최초 로그인 후)
/admin              관리자 대시보드
/admin/records      기록 승인
/admin/history      승인 히스토리
/admin/competitions 대회 관리
/admin/teams/[id]   팀·조 관리
/admin/notices      공지 관리
/admin/members      회원 관리 (팀·조 배정)
```

---

## API 목록

### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/login` | 로그인 (JSON) |
| POST | `/api/auth/first-login` | VIP 최초 로그인 |
| POST | `/api/auth/setup-account` | 계정 설정 |
| GET | `/api/me` | 내 정보 |
| POST | `/logout` | 로그아웃 |

### 공개 조회
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/competitions` | 전체 대회 목록 |
| GET | `/api/competitions/active` | 활성 대회 |
| GET | `/api/competitions/active/battle` | 팀 배틀 현황 |
| GET | `/api/ranking/members` | 개인 랭킹 |
| GET | `/api/ranking/teams` | 팀 랭킹 |
| GET | `/api/ranking/groups` | 조 랭킹 |
| GET | `/api/records/recent` | 활동 피드 |
| GET | `/api/notices` | 공지사항 |

### 인증 필요
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/records` | 기록 업로드 (multipart) |
| GET | `/api/records/my` | 내 기록 |
| GET | `/api/me/dashboard` | 대시보드 데이터 |
| GET/PUT | `/api/me/profile` | 프로필 조회/수정 |
| GET | `/api/members/{id}/profile` | 멤버 프로필 |
| GET | `/api/groups/{id}/members` | 조 멤버 목록 |

### 관리자
| Method | Endpoint | 설명 |
|--------|----------|------|
| CRUD | `/api/admin/competitions/**` | 대회 관리 |
| CRUD | `/api/admin/teams/**` | 팀 관리 |
| CRUD | `/api/admin/groups/**` | 조 관리 |
| PATCH | `/api/admin/records/{id}/approve\|reject` | 기록 승인/반려 |
| CRUD | `/api/admin/notices/**` | 공지 관리 |
| GET | `/api/admin/members` | 회원 목록 |
| PATCH | `/api/admin/members/{id}/assign` | 팀·조 배정 |

---

## 운영 배포

### Oracle VM 재배포

```bash
# SSH 접속
ssh -i C:/sshkey/ssh.key ubuntu@217.142.231.239

# 코드 업데이트 + 빌드 + 재시작
cd /opt/nd-running && git pull origin main
cd running-club && ./mvnw clean package -DskipTests -Pprod
sudo systemctl restart nd-running

# 로그 확인
sudo journalctl -u nd-running -f            # 실시간
sudo journalctl -u nd-running -n 100        # 최근 100줄
sudo journalctl -u nd-running --since today  # 오늘
sudo journalctl -u nd-running -p err         # 에러만
```

### Vercel 배포
- `git push origin main` → 자동 배포
- 환경변수: `NEXT_PUBLIC_API_URL` 삭제됨 (Vercel rewrites가 프록시)

---

## 트러블슈팅

### 1. 모바일에서 로그인/데이터 조회 전체 실패 (403/401)

**원인**
모바일 Chrome(iOS Safari 포함)이 3rd-party 쿠키를 차단함. Vercel(`running-club-iota.vercel.app`)에서 백엔드(`nd-running-club.duckdns.org`)로 API 요청 시 `credentials: "include"`로 JSESSIONID 쿠키를 보내지만, 서로 다른 도메인이므로 쿠키가 저장/전송되지 않음. 결과적으로 모든 인증 API가 실패.

**해결 — Vercel Rewrites 프록시**
`next.config.mjs`에 rewrites 추가하여 API 요청을 같은 도메인(Vercel)으로 프록시:
```js
// next.config.mjs
async rewrites() {
  return [
    { source: "/api/:path*", destination: "https://nd-running-club.duckdns.org/api/:path*" },
    { source: "/logout", destination: "https://nd-running-club.duckdns.org/logout" },
    { source: "/photos/:path*", destination: "https://nd-running-club.duckdns.org/photos/:path*" },
  ];
}
```
`api.ts`의 `BASE`를 빈 문자열로 변경 → 모든 요청이 같은 도메인 → 쿠키 정상 동작.

**방향성**: 크로스도메인 세션 쿠키는 점점 더 제한됨. 같은 도메인 프록시가 가장 안정적인 해결책.

**깨달은 점**: `SameSite=None; Secure` 설정만으로는 모바일 크로스도메인 쿠키 차단을 해결할 수 없다. 브라우저 정책이 점점 엄격해지고 있으므로, 근본적으로 같은 도메인으로 프록시하는 구조가 필요하다.

---

### 2. 최초 로그인 모바일에서 "세션이 만료되었습니다"

**원인**
최초 로그인(first-login) 시 세션에 name/phone을 저장하고, setup-account에서 세션에서 읽는 구조. 모바일에서 크로스도메인 쿠키가 차단되면 세션 자체가 유지되지 않아 setup-account 호출 시 name/phone을 읽을 수 없음.

**해결 — URL params fallback**
프론트: first-login 성공 후 `router.push(/setup-account?name=xxx&phone=xxx)` 로 URL에 name/phone 전달.
백엔드: `setupAccount()`에서 세션 → request body 순서로 fallback:
```java
if (name == null) { name = reqName; phone = reqPhone; }
```

**방향성**: 세션에 의존하는 2단계 플로우는 크로스도메인 환경에서 취약하다. 중요 데이터는 항상 fallback 경로를 마련해야 한다.

**깨달은 점**: 모바일 브라우저의 쿠키 정책은 PC와 다르다. "PC에서 되니까 모바일도 되겠지"는 위험한 가정이다.

---

### 3. 사진이 프론트엔드에서 로드되지 않음

**원인 1 — 상대경로 문제**
백엔드가 `/photos/abc123.jpg` (상대경로)를 반환하면, 프론트(localhost:3000 또는 Vercel)에서 자기 도메인의 `/photos/...`를 찾아서 404.

**해결 1 — resolvePhotoUrl 헬퍼**
```typescript
export function resolvePhotoUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BASE}${url}`; // 빈 문자열이면 같은 도메인 → rewrites 프록시
}
```

**원인 2 — server.base-url 도메인 오타**
`application-prod.properties`에서 `server.base-url=https://nd-running.duckdns.org`로 `-club`이 빠져있었음. DB에 저장된 기존 URL도 전부 잘못된 도메인.

**해결 2**: 설정 수정 + Supabase에서 `UPDATE running_records SET photo_url = REPLACE(...)` 실행.

**깨달은 점**: 도메인 이름 오타는 찾기 어렵다. 배포 후 실제 사진 로딩을 반드시 테스트해야 한다.

---

### 4. 홈 화면 배틀 카드가 안 보임 (Server Component fetch 실패)

**원인**
`NEXT_PUBLIC_API_URL` 환경변수를 삭제한 후, 홈페이지(Server Component)의 fetch URL이 `"http://localhost:8080"`으로 폴백됨. Vercel 서버에 localhost:8080이 없으므로 fetch 실패 → null → 카드 미표시.

**해결**
Server Component에서는 Vercel rewrites를 타지 않으므로, 백엔드 URL을 직접 지정:
```typescript
const SERVER_API = process.env.NEXT_PUBLIC_API_URL
  || process.env.API_BACKEND_URL
  || "https://nd-running-club.duckdns.org";
```

**방향성**: Client Component(api.ts)와 Server Component의 fetch 경로가 다르다는 점을 항상 인식해야 한다.

**깨달은 점**: Next.js App Router에서 Server Component는 서버에서 실행되므로 브라우저의 도메인/쿠키/rewrites를 사용할 수 없다. 환경변수 삭제 시 Server Component 영향을 반드시 확인해야 한다.

---

### 5. 대회 시작 전(READY) 랭킹이 빈 화면

**원인**
랭킹 페이지가 `getMemberRanking(activeCompetitionId)`로 호출 → 해당 대회의 기록만 필터 → 아직 시작 안 한 대회라 기록 0건 → 빈 배열.

**해결**
- 개인 순위: `getMemberRanking()` (competitionId 없이, 전 기간 누적)
- 팀/조 랭킹: 대회 기간(startDate~endDate) 내 기록만 집계하는 날짜 필터 추가
- READY 상태: "곧 시작" 안내 카드 + D-day 카운트다운

**방향성**: "개인 랭킹은 항상 보여야 한다"와 "팀 배틀은 대회 기간만 집계"는 서로 다른 요구사항이다. 하나의 쿼리로 처리하려 하지 말고 분리해야 한다.

**깨달은 점**: 대회 상태(READY/PROCEEDING/FINISHED)에 따라 UI가 어떻게 변해야 하는지 미리 정의하고 개발해야 한다. "시작 전"이라는 상태를 고려하지 않으면 빈 화면이 되어 사용자에게 혼란을 준다.

---

### 6. Vercel 빌드 실패 — TypeScript 타입 에러

**원인**
로컬에서는 `eslint: { ignoreDuringBuilds: true }` 설정으로 넘어가지만, TypeScript strict 모드에서 `null | undefined` 타입 불일치가 빌드 에러로 잡힘.

주요 케이스:
- `user.id`가 `number | null`인데 `number` 타입에 할당
- `onValueChange`가 `string | null`을 반환하는데 `string`만 받는 핸들러
- `null`과 `undefined`의 차이 (`?? undefined`로 변환 필요)

**해결**: 각 파일에서 `!` non-null assertion 또는 `?? undefined` / `?? "ALL"` 등으로 타입 좁히기.

**깨달은 점**: 로컬에서 `npm run dev`로 개발하면 타입 에러를 놓치기 쉽다. 배포 전 `npm run build`로 빌드를 돌려봐야 한다.

---

### 7. CORS 에러 — 401 응답에 Access-Control-Allow-Origin 헤더 없음

**원인**
Spring Security가 인증 필요 경로에서 401 반환 시, Spring MVC CORS 설정이 적용되기 전에 Security 필터가 먼저 응답을 내보냄. CORS 헤더 없는 401 → 브라우저가 CORS 에러로 표시.

**해결**
`SecurityConfig`에 `.cors(Customizer.withDefaults())` 추가.

**깨달은 점**: Spring Security + CORS는 설정 순서가 중요하다. Security 레이어에서도 CORS를 명시적으로 활성화해야 에러 응답에도 CORS 헤더가 포함된다.

---

### 8. Uncaught SyntaxError (next/font/google)

**원인**
`layout.tsx`에서 `next/font/google`(Inter 폰트) import 시 Vercel Edge Runtime에서 `__dirname is not defined` 에러 발생 → JS 청크 로드 실패.

**해결**: `next/font/google` import 제거.

**깨달은 점**: Next.js의 Edge Runtime은 Node.js API를 완전히 지원하지 않는다. `__dirname`, `fs` 등 Node 전용 API를 사용하는 라이브러리는 Edge Runtime에서 동작하지 않을 수 있다.

---

### 9. Oracle VM 외부 접속 불가

**원인**: iptables에서 `-A`(append)로 규칙 추가 시 기존 REJECT 규칙 뒤에 붙어서 효과 없음.

**해결**: `sudo iptables -I INPUT 1 -p tcp --dport 8080 -j ACCEPT` (앞에 삽입)

Oracle Cloud 콘솔도 확인:
- VCN → Security Lists → Ingress Rules
- Route Table → 인터넷 게이트웨이 Route Rule (누락 시 SSH도 불가)

**깨달은 점**: Oracle Cloud는 iptables + Security List + Route Table 3중 방화벽이다. 하나라도 빠지면 접속 불가. Route Table을 가장 먼저 확인하자.

---

### 10. Prometheus + Grafana 모니터링 설정

Oracle Cloud VM에 Docker Compose로 Prometheus + Grafana를 띄워 Spring Boot 앱을 모니터링하는 과정에서 겪은 트러블슈팅.

#### 전체 구조
```
Spring Boot (Actuator + Micrometer)
     │  /actuator/prometheus (메트릭 노출)
     ▼
Prometheus (Docker, :9090) ── 5초마다 스크래핑
     │
     ▼
Grafana (Docker, :3100) ── 대시보드 시각화
```

#### 설정 파일
- `running-club/src/main/resources/docker-compose.yml` — Prometheus + Grafana 컨테이너 정의
- `running-club/src/main/resources/prometheus.yml` — 스크래핑 대상 설정

#### 트러블슈팅 1: Grafana 포트 충돌
**문제**: Grafana 기본 포트 3000이 Next.js 개발 서버(3000)와 충돌.
**해결**: `docker-compose.yml`에서 Grafana 포트를 `3100:3000`으로 변경.

#### 트러블슈팅 2: Linux Docker에서 host.docker.internal 미지원
**문제**: `prometheus.yml`의 타겟이 `host.docker.internal:8080`인데, Linux Docker는 이 호스트명을 기본 지원하지 않음.
**해결**: `docker-compose.yml`의 prometheus 서비스에 `extra_hosts` 추가:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

#### 트러블슈팅 3: Oracle Cloud 포트 오픈 (2단계)
**문제**: Docker Compose를 실행해도 외부에서 9090, 3100 포트에 접속 불가.
**해결**:

**1단계 — Oracle Cloud Console (Security List)**:
VCN → Subnets → Security Lists → Add Ingress Rules:
| Source CIDR | Protocol | Dest Port |
|---|---|---|
| `0.0.0.0/0` | TCP | `9090` |
| `0.0.0.0/0` | TCP | `3100` |

**2단계 — VM iptables (REJECT 앞에 삽입)**:
```bash
sudo iptables -L INPUT --line-numbers   # REJECT 번호 확인
sudo iptables -I INPUT {REJECT번호} -p tcp --dport 9090 -j ACCEPT
sudo iptables -I INPUT {REJECT번호+1} -p tcp --dport 3100 -j ACCEPT
sudo netfilter-persistent save
```
⚠️ `-A`(append)가 아닌 `-I`(insert)로 REJECT 규칙 **앞에** 삽입해야 함. 뒤에 추가하면 REJECT가 먼저 적용되어 차단됨.

#### 트러블슈팅 4: Docker 미설치
**문제**: Oracle VM에 Docker가 기본 설치되어 있지 않음.
**해결**:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
```

#### 트러블슈팅 5: Prometheus 401 Unauthorized — Spring Security 차단
**문제**: Prometheus가 `/actuator/prometheus`를 스크래핑하려 하면 Spring Security가 401 반환. Targets 페이지에서 DOWN 표시.
**원인**: `/actuator/**` 경로가 Spring Security의 `anyRequest().authenticated()`에 걸림.
**해결 — Actuator 전용 SecurityFilterChain 분리**:
```java
@Bean
@Order(1)
public SecurityFilterChain actuatorFilterChain(HttpSecurity http) throws Exception {
    http.securityMatcher("/actuator/**")
        .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
        .csrf(csrf -> csrf.disable());
    return http.build();
}
```
단순히 `requestMatchers("/actuator/**").permitAll()`로는 해결되지 않았음. Spring Boot 3에서 Actuator 엔드포인트는 메인 Security 필터체인과 별도로 처리될 수 있어, `@Order(1)`로 우선순위가 높은 별도 필터체인을 만들어야 함.

#### 트러블슈팅 6: 운영(prod) 프로필에서 Prometheus 엔드포인트 비활성화
**문제**: `application.properties`에는 `management.endpoints.web.exposure.include=prometheus,health,info`가 있지만, `application-prod.properties`에는 `management.endpoints.web.exposure.include=health`만 있어서 운영 환경에서 `/actuator/prometheus` 엔드포인트가 노출되지 않음.
**해결**: `application-prod.properties` 수정:
```properties
management.endpoints.web.exposure.include=prometheus,health,info
```

#### 트러블슈팅 7: git pull만 하고 빌드(mvnw package) 누락
**문제**: 서버에서 `git pull` 후 `sudo systemctl restart nd-running`만 실행. 코드는 최신인데 이전 jar로 실행되어 변경사항 미반영.
**원인**: Java는 소스코드를 직접 실행하지 않음. `.java` → `.jar`로 빌드해야 함.
**해결**: 서버 재배포 시 반드시 빌드 포함:
```bash
cd /opt/nd-running && git pull origin main
cd running-club && ./mvnw clean package -DskipTests
sudo systemctl restart nd-running
```
`mvnw package`는 프론트엔드의 `npm run build`와 같은 역할. 소스코드를 실행 가능한 jar 파일로 컴파일하는 단계.

#### 트러블슈팅 8: Grafana 대시보드 Import 실패 (DS_RPOMETHEUS)
**문제**: 대시보드 ID `4701`(JVM Micrometer) Import 시 `datasource &{DS_RPOMETHEUS} was not found` 에러.
**원인**: 대시보드 템플릿 자체의 오타 — `DS_PROMETHEUS`가 아닌 `DS_RPOMETHEUS`로 되어 있음.
**해결**: 대시보드 ID `19004`(Spring Boot 3.x + Micrometer)로 대체하여 Import 성공.

#### Grafana 초기 설정 순서
1. **데이터소스 추가**: Connections → Data sources → Add data source → Prometheus → URL: `http://prometheus:9090` → Save & Test
2. **대시보드 Import**: Dashboards → New → Import → ID `19004` → Load → Prometheus 데이터소스 선택 → Import

**깨달은 점**:
- Spring Security와 Actuator의 보안은 별도로 처리해야 한다. 메인 필터체인의 `permitAll()`이 Actuator에 적용되지 않을 수 있다.
- `application-prod.properties`가 `application.properties`를 오버라이드하므로, 운영 환경에서 필요한 설정은 반드시 prod 프로필에도 명시해야 한다.
- Java 배포는 `git pull → 빌드(mvnw package) → 재시작` 3단계. 빌드를 빠뜨리면 이전 코드로 실행된다.
- Grafana 커뮤니티 대시보드는 오타/호환성 문제가 있을 수 있다. 안 되면 다른 ID로 시도하자.

---

## 응답 포맷

공개 API:
```json
{ "success": true,  "data": [...], "message": null }
{ "success": false, "data": null,  "message": "에러 메시지" }
```
관리자/인증 API는 데이터 직접 반환 (래퍼 없음).
