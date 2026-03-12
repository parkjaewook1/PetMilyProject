# 🐾 Petmily - 반려동물 커뮤니티 서비스

반려동물과 반려인을 위한 커뮤니티 웹 서비스입니다.
Spring Boot 기반 백엔드와 React 기반 프론트엔드로 구성된 풀스택 프로젝트입니다.

🔗 **Live Demo** : https://pet-mily-project.vercel.app
📑 **PPT** : https://jaewookpark.my.canva.site/petmily-ppt

---

## ✨ Key Features

- Spring Security Filter Chain 기반 JWT 인증 구조 설계
- Access Token / Refresh Token 기반 로그인 시스템
- 네이버 OAuth2 소셜 로그인
- 관리자 / 사용자 권한 분리
- N-Depth 계층형 댓글 시스템 (재귀 구조)
- Oracle Cloud 기반 서버 배포

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

### 1. JWT 로그아웃 후 토큰 유효 문제
JWT는 Stateless 구조이기 때문에 로그아웃 후에도 Access Token이 만료될 때까지 유효한 문제가 발생했습니다.
Refresh Token을 DB에 저장하고 로그아웃 시 DB에서 삭제하는 방식으로 재발급 루트를 차단했습니다.

### 2. ROLE_ prefix 매핑 불일치
토큰에는 `ROLE_USER`, 서버 Enum에는 `USER` 형태로 저장되어 인증 객체 생성 시 예외가 발생했습니다.
JWT 파싱 단계에서 prefix를 제거하고 정규화하는 방어 로직을 추가해 해결했습니다.

### 3. AWS 비용 문제 → Oracle Cloud 마이그레이션
AWS 프리티어 종료 후 비용 절감이 필요했습니다.
Oracle Cloud 무료 인스턴스(Ubuntu)로 마이그레이션하고, 이미지를 서버 내부에서 직접 관리하여 외부 API 호출 없이 즉시 서빙하는 구조로 개선했습니다.

### 4. N-Depth 댓글 렌더링
단순 반복문으로는 깊이가 정해지지 않은 계층 구조를 렌더링하기 어려웠습니다.
컴포넌트가 자기 자신을 재귀 호출하는 구조로 설계하고, `padding-left`를 동적으로 계산해 시각적 계층을 표현했습니다.

---

## 👤 담당 역할

- 백엔드 전체 (인증/권한, 회원, 다이어리, 방명록)
- 프론트엔드 전체 (React, Axios 인터셉터, Context API)
- 배포 환경 구축 (Oracle Cloud + Vercel)
