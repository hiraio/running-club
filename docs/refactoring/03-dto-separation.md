# 리팩토링 03 — DTO 패키지 분리 (domain → dto)

> 날짜: 2026-07-16
> 피드백: "도메인 폴더에 DTO 들어있다, 분리하는 것이 좋겠습니다."

## 왜 문제인가

- 기존 `domain/` 패키지에 **55개 파일**이 있었는데 실제 JPA 엔티티/enum은 14개뿐, 나머지 41개가 요청/응답 DTO였다.
- **관심사가 다르다**: 엔티티는 DB 스키마와 비즈니스 규칙(수명이 길고 변경에 신중해야 함), DTO는 API 계약(화면 요구에 따라 자주 바뀜). 한 패키지에 섞이면 "이 클래스를 고치면 DB가 바뀌는가, API 응답이 바뀌는가"를 이름만으로 판단할 수 없다.
- **아키텍처 규칙 표현**: "엔티티를 직접 반환하지 않는다"는 이 프로젝트의 규칙이 패키지 구조로 드러나지 않았다. 분리 후에는 `controller가 domain을 반환하면 안 되고 dto를 반환해야 한다`는 규칙을 패키지 의존성만 봐도 검증할 수 있다 (ArchUnit 같은 도구 적용도 가능해짐).

## 분리 기준

기술 유형(request/response)이 아니라 **도메인 기능 단위**로 하위 패키지를 나눴다. 화면/기능이 바뀔 때 같이 바뀌는 DTO끼리 묶이는 게 응집도가 높기 때문.

```
com.running.club
├── domain/            엔티티 + enum만 (14개)
│     Member, Team, RunningGroup, Competition, CompetitionStatus,
│     RunningRecord, Notice, RankSnapshot, MemberProfile, FirstLoginCandidate,
│     BingoBoard, BingoMission, BingoSubmission, BingoSubmissionStatus
├── dto/
│   ├── auth/          로그인·가입 (9): LoginRequest, JoinRequest/Response, MeResponse,
│   │                  FirstLoginRequest, SetupAccountRequest, *ForJoinDTO(가입 화면용) 3종
│   ├── member/        회원 (7): AdminMemberDTO, AssignMemberRequest, GroupMemberDTO,
│   │                  MemberDashboardResponse, MemberProfile{Request,Response}, MemberPublicProfileResponse
│   ├── record/        기록 (4): RunningRecordDTO, RecentFeedResponse, AdminHistoryDTO, TodayMvpDTO
│   ├── ranking/       랭킹 (2): RankingDTO, GroupContributionDTO
│   ├── competition/   대회·팀·조 관리 (12): Competition/Team/RunningGroup의 CRUD Request/Response
│   ├── notice/        공지 (4): NoticeCreateRequest, NoticeUpdateRequest, NoticeResponse, NoticeSummaryDTO
│   ├── bingo/         빙고 (1): BingoBoardResponse
│   └── common/        공통 (1): ApiResponse<T> 래퍼
└── security/          CustomUserDetails (1)
```

- **CustomUserDetails**는 DTO도 엔티티도 아닌 Spring Security 어댑터라서 별도 `security/` 패키지로 이동했다. (세션에 직렬화되어 저장되는 클래스지만 서버 세션은 인메모리라 패키지 변경으로 인한 역직렬화 문제 없음 — 배포 시 세션이 초기화되는 것은 기존과 동일)

## 진행 방법 (수동 이동의 함정 포함)

IDE 리팩토링 없이 이동했기 때문에 다음 세 가지를 모두 처리해야 했다:

1. **파일 이동 + package 선언 수정** — `git mv`로 이동해 git 히스토리에 rename으로 기록.
2. **프로젝트 전체 FQN 치환** — import 문뿐 아니라 **JPQL `@Query` 문자열 안의 생성자 표현식**도 고쳐야 했다:
   ```java
   @Query("SELECT new com.running.club.domain.RankingDTO(...) FROM ...")
   →      "SELECT new com.running.club.dto.ranking.RankingDTO(...) FROM ..."
   ```
   이런 FQN이 리포지토리 5개 파일에 16곳 있었다. **문자열이라 컴파일러가 못 잡고**, 앱 기동 시(리포지토리 프록시 생성 시점)에야 터진다 — 컴파일 성공만으로는 검증이 안 되는 부분.
3. **같은 패키지여서 임포트 없이 참조하던 관계 복구** — DTO가 엔티티를 참조(`TeamResponse.from(Team)`)하거나 DTO끼리 참조(`MemberDashboardResponse` → `RunningRecordDTO`)하던 것이 전부 임포트 필요해짐 → 16개 파일에 임포트 추가.

사전 작업인 **와일드카드 임포트 제거(01)가 선행됐기 때문에** 어떤 파일이 어떤 클래스를 쓰는지 전부 명시적이어서 기계적 치환이 안전했다. (순서가 반대였으면 `domain.*` 임포트가 이동 후 조용히 깨졌다.)

## 검증

1. `./mvnw clean compile` — 통과
2. `./mvnw test` (`@SpringBootTest` 컨텍스트 기동) — 통과
   - 12개 JPA 리포지토리 프록시 생성 성공 = **JPQL 문자열 치환까지 유효함을 확인** (2번 함정 검증)
3. 구 FQN(`com.running.club.domain.<이동한 클래스>`) 잔여 참조 grep — 0건
4. domain 잔류 14개 파일이 이동한 클래스를 참조하는 케이스 — 0건 (엔티티→DTO 의존 없음 확인, 방향성 건전)

## 결과

- `domain/` 55개 → 14개 (엔티티+enum만), DTO 40개는 `dto/` 8개 하위 패키지로, CustomUserDetails는 `security/`로
- API 스펙·DB 스키마·동작 변경 없음 (패키지 이동만)
- 프론트엔드 영향 없음 (JSON 직렬화는 패키지와 무관)
- **배포 주의**: 백엔드 변경이므로 Oracle VM 재배포 필요 (Vercel과 달리 자동 배포 아님)
