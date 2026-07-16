# 리팩토링 02 — 테스트 클래스 패키지 수정

> 날짜: 2026-07-16
> 배경: "테스트 코드 작성하면 좋겠습니다" 피드백의 선행 작업

## 발견한 문제

유일한 테스트 파일이 잘못된 패키지에 있었다:

```
(수정 전) src/test/java/com/example/demo/RunningClubApplicationTests.java   ← package com.example.demo
(수정 후) src/test/java/com/running/club/RunningClubApplicationTests.java   ← package com.running.club
```

프로젝트 생성 시 Spring Initializr 기본값(`com.example.demo`)에서 메인 패키지만 `com.running.club`으로 바꾸고 테스트는 방치된 것.

## 왜 문제인가

`@SpringBootTest`는 설정 클래스를 명시하지 않으면 **테스트 클래스의 패키지에서 위로 올라가며** `@SpringBootConfiguration`(= `@SpringBootApplication`)을 탐색한다.

- `com.example.demo` → `com.example` → `com` 순으로 탐색하지만 `RunningClubApplication`은 `com.running.club`에 있으므로 **절대 찾을 수 없다**.
- 실제로 `./mvnw test` 실행 시 다음 에러로 실패:
  ```
  java.lang.IllegalStateException: Unable to find a @SpringBootConfiguration
  by searching packages upwards from the test.
  ```
- 즉, 이 프로젝트는 지금까지 `mvnw test`가 **깨져 있는 상태**였다 (운영 빌드는 `-DskipTests`라 드러나지 않았음).

앞으로 테스트를 추가하려면(Phase 3) 테스트 루트 패키지가 메인과 일치해야 `@SpringBootTest`, `@DataJpaTest`, `@WebMvcTest` 모두 설정 자동 탐색이 동작한다.

## 진행 방법

1. `com/running/club/RunningClubApplicationTests.java` 생성 (패키지 선언만 변경, 내용 동일)
2. 기존 `com/example/` 디렉터리 삭제
3. `./mvnw test` 실행 → 1차 실패: `target/test-classes`에 **구버전 컴파일 클래스가 잔존**해서 삭제된 `com.example.demo` 테스트가 같이 실행됨 (심지어 pull로 삭제된 `DataInitializer.class`도 잔존 실행 확인)
4. `./mvnw clean test` 재실행 → **테스트 통과** (Spring 컨텍스트 정상 기동, 12개 JPA 리포지토리 스캔 확인)

## 배운 점

- **소스 삭제 ≠ 클래스 삭제**: Maven `compile`은 삭제된 소스의 `.class`를 target에서 지우지 않는다. 파일을 지우거나 이동한 뒤에는 반드시 `clean`을 한 번 돌려야 유령 클래스가 안 남는다.
- `contextLoads()` 테스트는 형식적으로 보이지만 "모든 빈 배선 + JPQL 쿼리 문법 검증(리포지토리 프록시 생성 시점)"을 커버하는 최소한의 안전망이다. 이제 이 안전망이 실제로 동작한다.

## 결과

- `mvnw test` 정상 동작 복구 — Phase 3(테스트 작성)의 기반 확보
- 커밋 대상: 파일 이동 1건
