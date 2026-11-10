> 최신 확인(2026-11-10): 현재 소스에서 선택 Gradle test/build를 재확인했으며 7개 task가 UP-TO-DATE였다. 기존 XML은 111건 중 103 통과·MariaDB opt-in 8 skip·실패/오류 0이다. 프론트는 새 build 성공, 기존 청크 경고 유지. 아래는 앞선 단계의 기록이며 전체 조사를 재실행한 뜻이 아니다. 공개 파일 목록·이력/콘솔 보류는 [RELEASE_READY.md](RELEASE_READY.md)를 따른다.

# 검증 근거 및 최신 소스 확인

## 기록된 상세 결과

최신 회원 보안 수정 보고서와 JUnit/브라우저 결과는 로컬 `docs/redesign/member-security-fix/`에 있다.

- 기존 default/local/prod H2·MockMvc 각 28개: 84개 통과.
- 새 보안 단위 검사: 13개 통과. 합계 97개.
- MariaDB 12.0.2/InnoDB, 실제 Spring Boot HTTP: JUnit 8개/내부 상태 검사 55개 통과.
- 실제 Chrome + 실제 React 화면: 검사 17개 통과.
- source와 별도로 구성한 최소 fixture DB이며 운영 스키마 동일성은 미검증.
- 관련 프론트 린트는 기존 12 errors/2 warnings가 남고, 기준선 대비 새 메시지는 0.

위 결과는 배포 서버/운영 데이터 검사가 아니다. MariaDB/Chrome 상세 검사는 이번 공개 준비에서 반복하지 않았다. 로그·원본 스크린샷·소스 사본은 개인정보 검토 없이 일괄 업로드할 대상으로 분류하지 않는다.

## 이번 공개 준비에서 확인한 것

- `./gradlew test --tests 'com.backend.admin.*' build`: 성공. Gradle 입력이 바뀌지 않아 전체 대상 task가 up-to-date였다. 새 검사를 실행했다고 표현하지 않는다.
- `npm run build`: 새 빌드 성공. 기존 500kB 초과 청크 경고 유지.
- 제품 Java/JS/CSS/테스트는 이번에 수정하지 않았다. README와 새 공개 준비 문서/예시/패치만 준비했다.
- 포트폴리오 후보 patch는 대상 저장소에서 `git apply --check` 성공. 적용/그 저장소의 빌드/푸시는 하지 않았다.

## 미검증

운영 DB/실데이터, HTTPS·cross-site 쿠키·proxy, 외부 OAuth·실제 메일·파일 업로드/탈퇴, 모든 동시 Refresh/권한 변경, 전체 UI·모든 외부 지도/AI/채팅 상태. 기존 전체 BackendApplicationTests.contextLoads는 실제 설정/DB를 읽을 수 있어 실행하지 않았다.

전체 앱 외부 설정 예시는 placeholder 문서이며 실제 외부 서비스로 시작해 본 설정이 아니다. 비밀값 정리 전에는 기존 환경 설정으로 운영 연결이나 공개 배포를 수행하지 않는다.
