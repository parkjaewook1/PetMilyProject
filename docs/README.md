# Petmily 개발 문서

Petmily는 2024년 6~7월에 진행한 5인 팀 프로젝트입니다. 다이어리와 방명록, 캘린더 연동, Spring Boot API와 React 화면 연결을 담당했습니다. 인증 구조는 팀에서 구현했으며, 프로젝트를 마친 뒤 기존 인증 흐름과 회원·관리자 기능을 개선했습니다.

| 읽을 문서 | 내용 |
| --- | --- |
| [시스템 아키텍처](ARCHITECTURE.md) | 요청 흐름, ERD, 배포와 이미지 저장 |
| [로그인과 토큰 처리](AUTHENTICATION.md) | Spring Security, Access·Refresh Token, Role, Axios |
| [다이어리와 방명록](FEATURES.md) | API, FullCalendar, 페이징, 재귀 렌더링과 MyBatis |
| [트러블슈팅 및 리팩토링](TROUBLESHOOTING.md) | 회원·관리자 API 문제와 화면 개선 과정 |
| [테스트](TESTING.md) | H2·MockMvc, MariaDB·HTTP, Chrome 테스트 |
| [로컬 실행](LOCAL_DEVELOPMENT.md) | 개발 환경, 실행과 격리 테스트 명령 |

[프로젝트 README](../README.md)

---

참고: [이전 문서와 현재 위치](DOCUMENT_MAP.md) · [배포 전 확인 사항](publication/RELEASE_READY.md)
