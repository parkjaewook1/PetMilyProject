# 🐾 Petmily - 반려동물 커뮤니티 서비스

반려동물과 반려인을 위한 커뮤니티 웹 서비스입니다.
Spring Boot 기반 백엔드와 React 기반 프론트엔드로 구성된 풀스택 프로젝트입니다.

🔗 **Live Demo** : https://pet-mily-project.vercel.app
📑 **PPT** : https://jaewookpark.my.canva.site/petmily-ppt

---

## 🛠 Tech Stack

| 구분 | 기술 |
|------|------|
| Frontend | React, Vite, Axios, ChakraUI |
| Backend | Java, Spring Boot, Spring Security, JWT, OAuth2, MyBatis |
| Database | MariaDB |
| Deployment | Oracle Cloud (Ubuntu), Vercel |

---

## 🔐 인증 구조

- **Spring Security Filter Chain** 기반으로 인증 흐름을 설계
- 로그인 / JWT 검증 / 로그아웃을 각각 독립된 필터로 분리
- Access Token → 응답 헤더 발급
- Refresh Token → HttpOnly 쿠키 전달 + DB 저장
- 로그아웃 시 DB에서 Refresh Token 삭제 → 재발급 차단

---

## 📌 주요 기능

- JWT 기반 로그인 / 로그아웃 / 토큰 재발급
- 네이버 OAuth2 소셜 로그인
- 회원 CRUD / 프로필 이미지 업로드 (Oracle Cloud 로컬 스토리지)
- 관리자 / 일반 사용자 권한 분리
- 미니홈피 다이어리 (하루 1기록, 캘린더, 감정 통계)
- 계층형 댓글 시스템 (N-Depth 재귀 컴포넌트)
- 반응형 레이아웃 (PC / 모바일)

---

## 🗂 프로젝트 구조
```
PetMilyProject/
├── backend/   # Spring Boot
└── frontend/  # React + Vite
```

---

## 🛠 트러블슈팅

| 문제 | 해결 |
|------|------|
| JWT 로그아웃 후 토큰 유효 문제 | Refresh Token DB 저장 후 로그아웃 시 삭제 |
| ROLE_ prefix 매핑 불일치 | JWT 파싱 시 prefix 제거 + 방어 로직 추가 |
| AWS 비용 문제 | Oracle Cloud 무료 인스턴스로 마이그레이션 |
| N-Depth 댓글 렌더링 | 재귀 컴포넌트 설계로 해결 |

---

## 👤 담당 역할

- 백엔드  (인증/권한, 회원, 다이어리, 방명록)
- 프론트엔드  (React, Axios 인터셉터, Context API)
- 배포 환경 구축 (Oracle Cloud + Vercel)
