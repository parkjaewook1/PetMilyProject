# Petmily 공개 준비 상태

Petmily는 2024년 5인 팀 프로젝트입니다. 현재 공개 코드에는 프로젝트 종료 후 진행한 회원 조회 응답 분리, 관리자 권한 확인, Refresh Token 처리, 비밀번호 변경, 회원 삭제 정책, UI·반응형 개선이 포함되어 있습니다.

## 로컬 실행

JDK 21, Node.js/npm, 별도의 개발용 MariaDB와 스키마가 필요합니다. DB와 인증 설정은 저장소 밖의 개발용 설정 파일에 준비합니다. [로컬 실행 문서](../LOCAL_DEVELOPMENT.md) · [외부 설정 예시](config/application.example.properties)

## 검증 범위

회원·관리자 기능은 격리 환경에서 H2·MockMvc, MariaDB를 사용한 HTTP 검사, Chrome 화면 검사로 확인했습니다. 각 검사 결과와 빌드 기록은 [검증 문서](VERIFICATION.md)에 있습니다.

운영 DB 스키마, 배포 환경의 HTTPS·쿠키·프록시, 외부 OAuth·메일·파일 연동과 동시 토큰 재발급·권한 변경의 일부 경우는 추가 검증이 필요합니다.

## 공개 및 배포 전 확인

- 과거 Git 이력의 DB·JWT·AWS 설정은 환경별 실제 사용 여부와 폐기·교체 상태를 확인해야 합니다. 현재 설정을 외부화해도 과거 커밋의 내용은 남습니다.
- Kakao 지도 JavaScript 키는 콘솔에서 등록 도메인과 사용 범위를 확인해야 합니다.
- SQL 백업과 비공개 설정은 별도로 보관합니다.
