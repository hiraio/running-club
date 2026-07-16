# 리팩토링 01 — 와일드카드 임포트 제거

> 날짜: 2026-07-16
> 피드백: "와일드카드 임포트 하지 말아주세요."

## 왜 문제인가

- **의존성 불투명**: `import com.running.club.domain.*;`만 보면 이 파일이 도메인의 어떤 클래스에 의존하는지 코드 리뷰에서 알 수 없다. 명시적 임포트는 파일 상단만 봐도 의존 관계가 드러난다.
- **이름 충돌 위험**: 두 패키지를 `*`로 임포트하면 같은 이름의 클래스가 양쪽에 추가될 때 기존 코드가 갑자기 컴파일 에러를 낸다 (예: `java.util.*` + `java.awt.*`의 `List`).
- **리팩토링 안전성**: 이번 Phase 1의 다음 단계(DTO 패키지 분리)에서 클래스를 이동할 때, 와일드카드가 있으면 "어떤 파일이 어떤 클래스를 쓰는지"를 컴파일러 없이 추적할 수 없다. 명시적 임포트는 이동 대상 클래스의 참조 지점을 grep 한 번으로 찾게 해준다.
- **컨벤션**: Google Java Style Guide 등 대부분의 사내 컨벤션이 와일드카드 임포트를 금지한다. IDE가 자동 생성하는 것이지 개발자가 의도한 것이 아니라는 인상을 준다.

## 대상 파일 (20개)

| 분류 | 파일 | 제거한 와일드카드 |
|------|------|------------------|
| 엔티티 | BingoBoard, BingoMission, BingoSubmission, Competition, Member, MemberProfile, Notice, RankSnapshot, RunningGroup, RunningRecord, Team | `jakarta.persistence.*`, `lombok.*` |
| 엔티티 | FirstLoginCandidate | `jakarta.persistence.*` |
| DTO | RecentFeedResponse | `lombok.*` |
| Config | BingoDataInitializer | `com.running.club.domain.*`, `com.running.club.repository.*` |
| Controller | AdminBingoController, BingoController | `org.springframework.web.bind.annotation.*` |
| Controller | AdminMemberController, MemberController | `com.running.club.domain.*`, `web.bind.annotation.*` |
| Service | BingoService | `domain.*`, `repository.*` |
| Service | CompetitionBattleService, MemberService | `domain.*` |
| Service | RankSnapshotService | `domain.*`, `java.util.*` |

## 진행 방법

1. `Grep`으로 `import .*\.\*;` 패턴 전수 조사 → 20개 파일 확인
2. 각 파일 전체를 읽고 **실제 사용 중인 클래스만** 추려 명시적 임포트로 교체
   - 예: `Member.java`의 `jakarta.persistence.*` → 실제 사용은 `Column, Entity, FetchType, GeneratedValue, GenerationType, Id, JoinColumn, ManyToOne, PrePersist, Table` 10개
   - 예: `RankSnapshotService.java`의 `java.util.*` → 실제 사용은 `LinkedHashMap, List, Map` 3개
3. 교체 후 `Grep` 재검사 → 와일드카드 0건
4. `./mvnw -q compile` → **컴파일 성공** (누락/오타 없음 검증)

## 재발 방지 (IDE 설정 권장)

IntelliJ IDEA: `Settings → Editor → Code Style → Java → Imports`
- `Class count to use import with '*'`: **99**
- `Names count to use static import with '*'`: **99**
- `Packages to Use Import with '*'` 목록 비우기

이 설정을 하면 IDE 자동 임포트가 다시 와일드카드를 만들지 않는다.

## 결과

- 와일드카드 임포트 34건 → 0건 (20개 파일)
- 동작 변경 없음 (임포트 표기만 변경, 바이트코드 동일)
- 컴파일 검증 완료
