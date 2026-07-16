# 리팩토링 04 — DB 인덱스 설계

> 날짜: 2026-07-16
> 피드백: "DB 테이블에 인덱스 잘 설정하였는가?"
> 적용 SQL: [04-db-indexes.sql](./04-db-indexes.sql)

## 전제: 왜 인덱스가 하나도 없었는데 지금까지 문제가 없었나

- 로컬 H2는 데이터가 적고, 운영 Supabase도 아직 수천 행 이하라 풀스캔(Seq Scan)도 밀리초 안에 끝난다.
- 하지만 `running_records`는 **회원 수 × 매일 기록 수만큼 무한히 자라는 유일한 테이블**이고, `rank_snapshots`는 매일 자정 스케줄러가 (회원 수 + 조 수)만큼 쌓는다. 이 둘은 시간이 지날수록 풀스캔 비용이 선형으로 증가한다.
- 결정적으로, **PostgreSQL은 MySQL(InnoDB)과 달리 FK 컬럼에 인덱스를 자동 생성하지 않는다.** MySQL 경험 기준으로 "FK니까 인덱스 있겠지"라고 가정하면 PostgreSQL에서는 전부 풀스캔이다. (PK와 UNIQUE 제약에만 인덱스가 자동 생성됨)

## 설계 원칙 (이 DBMS에서 왜 이게 최적인가)

PostgreSQL의 기본 인덱스는 **B-tree**다. B-tree 복합 인덱스는 "왼쪽 컬럼부터 정렬된 전화번호부"이므로:

1. **등가(=) 조건 컬럼을 앞에, 범위(BETWEEN/</>) 조건 컬럼을 마지막에** 둔다. 범위 조건 뒤의 컬럼은 인덱스 탐색에 쓰이지 못하기 때문.
2. **저카디널리티 컬럼(status: 3종)도 분포가 치우쳐 있으면 유효하다.** `status='WAITING'`은 전체의 극소수(승인 대기분)라 인덱스가 소수 행만 콕 집어내지만, `status='APPROVED'`는 대부분의 행이라 플래너가 통계를 보고 풀스캔을 선택한다 — 이건 인덱스가 실패한 게 아니라 **풀스캔이 실제로 더 싼 것**이고, PostgreSQL 플래너가 `pg_statistic` 기반으로 알아서 판단한다.
3. **`ORDER BY + LIMIT`은 인덱스가 정렬을 대체한다.** B-tree는 양방향 스캔이 가능해서 `(status, verified_at)` 인덱스가 있으면 `ORDER BY verified_at DESC LIMIT 10`을 "정렬 없이 인덱스 끝에서 10건 걷기"로 처리한다 (DESC 인덱스 불필요).
4. **인덱스는 공짜가 아니다**: INSERT/UPDATE마다 모든 인덱스를 갱신해야 하고(쓰기 비용), 디스크와 `shared_buffers` 캐시를 차지한다. 그래서 **쿼리 패턴에 실제로 등장하는 조합만, 자라는 테이블에만** 만들었다.

## 쿼리 → 인덱스 매핑

`RunningRecordRepository`의 24개 쿼리를 전수 분석해 WHERE/ORDER BY 패턴을 5개 그룹으로 묶었다:

### running_records (5개)

| 인덱스 | 담당 쿼리 | 근거 |
|--------|----------|------|
| `(member_id, status)` | `getTotalApprovedDistanceByMember`, `countApprovedByMember`, `findRecentApproved`, `hasRunToday`, `findByMember` | 대시보드 진입마다 실행. member_id 등가 + status 등가 → 한 회원의 기록만 정확히 스캔. 회원당 행 수가 적어 이후 date 필터는 힙에서 걸러도 충분 |
| `(competition_id, status, running_date)` | `getTeamRankingByCompetition`, `getGroupRankingByCompetition`, `getMemberRankingByCompetition`, `getGroupContributionsByCompetition`, `findTodayMvpCandidates` | 홈 배틀카드 + 랭킹 페이지의 핵심 쿼리. **등가(competition_id) → 등가(status) → 범위(running_date)** 순서라 세 조건 모두 인덱스 탐색으로 처리. 범위 컬럼을 마지막에 둔 것이 핵심 |
| `(status, running_date)` | `findWaiting`(WAITING만), `findDailyKingAll`(=오늘), `findWeeklyDistancePerMember`(주간 범위) | WAITING은 극소수 행이라 선택도가 높고, Daily King/Rising Star는 status 등가 + 날짜 등가/범위로 최근 며칠 분만 스캔 |
| `(status, verified_at)` | `findLatestApproved` (홈 활동 피드) | 홈 화면마다 실행되는 `ORDER BY verified_at DESC LIMIT 10` — 인덱스 역방향 스캔으로 정렬 자체를 제거 (원칙 3) |
| `(photo_hash)` | `existsByPhotoHash` | 기록 업로드마다 실행되는 중복 사진 검사. 등가 단일 조회의 교과서적 케이스 — 인덱스 없으면 업로드가 테이블 크기에 비례해 느려짐 |

- 전 기간 랭킹(`getMemberRanking` 등, `status='APPROVED'`만 조건)은 **의도적으로 커버하지 않았다** — 대부분 행이 APPROVED라 플래너가 풀스캔을 선택할 것이고 그게 옳다 (원칙 2). 이 쿼리가 느려지면 인덱스가 아니라 집계 테이블/캐시로 풀 문제.

### rank_snapshots (1개)

| 인덱스 | 담당 쿼리 | 근거 |
|--------|----------|------|
| `(entity_type, competition_id, snapshot_date)` | `findLatestBeforeToday`(date 범위+DESC 정렬), `deleteByTypeAndCompetitionAndDate`(date 등가) | 기존 유니크 제약 `(entity_type, entity_id, competition_id, snapshot_date)`이 만든 인덱스는 **2번째 컬럼이 entity_id인데 쿼리는 entity_id를 고정하지 않으므로** entity_type 접두어까지만 쓰고 멈춘다. 쿼리가 실제로 고정하는 3개 컬럼 순서 그대로의 별도 인덱스가 필요. 매일 수십 행씩 영구히 쌓이는 테이블이라 장기적으로 효과가 커짐 |

## 의도적으로 인덱스를 만들지 않은 테이블 (판단 근거)

| 테이블 | 이유 |
|--------|------|
| `members` | 수십~수백 행에서 상한. 이 크기면 테이블 전체가 페이지 몇 개라 **플래너가 인덱스가 있어도 풀스캔을 선택한다** (랜덤 I/O + 인덱스 페이지 접근이 순차 스캔보다 비쌈). 로그인 조회(`login_id`)는 `unique=true` 제약이 만든 유니크 인덱스가 이미 처리 |
| `first_login_candidates` | 신입 기수 수만큼만 존재하는 소형 테이블. 동일 논리 |
| `notices`, `bingo_*` | 수십 행 상한. `bingo_submissions`의 핵심 조회(`mission_id, group_id`)는 유니크 제약 인덱스가 이미 커버 |

인덱스를 "다 붙이는 것"이 아니라 **안 붙일 곳을 아는 것**까지가 설계다 — 소형 테이블의 인덱스는 조회 이득 없이 쓰기 비용과 관리 대상만 늘린다.

## 적용 방법 (2중 적용인 이유)

1. **엔티티 `@Table(indexes = ...)` 선언** — `RunningRecord.java`, `RankSnapshot.java`
   - 스키마의 단일 진실 공급원(코드) 유지, 새 환경(로컬 H2 초기화 등)에서 자동 생성
2. **Supabase에 SQL 수동 실행** — [04-db-indexes.sql](./04-db-indexes.sql)
   - `ddl-auto=update`는 **기존 테이블에 대한 인덱스 추가를 보장하지 않는다** (Hibernate update는 테이블/컬럼 추가는 해주지만 인덱스 동기화는 버전에 따라 불완전). 운영 DB는 반드시 SQL로 확정 적용
   - 인덱스 이름을 `@Index` 선언과 동일하게 맞춰서, Hibernate가 나중에 중복 생성을 시도하지 않게 함
   - `CREATE INDEX CONCURRENTLY`는 쓰지 않았다: Supabase SQL Editor는 트랜잭션으로 감싸는데 CONCURRENTLY는 트랜잭션 안에서 실행 불가. 현재 행 수에서 일반 CREATE INDEX의 락 시간은 밀리초 수준이라 무중단 옵션이 불필요

## 검증

- `./mvnw clean test` — 통과 (컨텍스트 기동 정상)
- 로컬 H2 카탈로그(`INFORMATION_SCHEMA.INDEXES`) 직접 조회 — **신규 인덱스 6개 전부 생성 확인** (`ddl-auto=update`가 이 환경에선 인덱스를 추가함)
- 부수 확인: H2는 FK 컬럼 인덱스를 **자동 생성**(`FK..._INDEX` 행들)하지만 PostgreSQL은 하지 않는다 — "로컬(H2)에선 빨랐는데 운영(PostgreSQL)에서 느린" 상황의 전형적 원인. 로컬에서 성능 문제가 안 보였던 이유이기도 함
- 운영 적용 후 확인 쿼리 (04-db-indexes.sql 하단 주석):
  - `pg_indexes`로 생성 여부 확인
  - `EXPLAIN ANALYZE`로 대표 쿼리가 `Index Scan`/`Bitmap Index Scan`을 타는지 확인

## 남은 배포 절차 (수동)

1. Supabase SQL Editor에서 `04-db-indexes.sql` 실행
2. git push 후 Oracle VM 재배포 (엔티티 변경 반영 — CLAUDE.md 배포 절차 참고)
