# Petmily 선별 반영 준비

> **최종 선별 staging 승인 판단(2026-11-10):** 사용자가 SQL은 2024년 팀원들이 외부 DB를 가져오지 않고 직접 작성한 테스트 데이터라고 확인했다. 병원 테스트 `76da173`, 일기 테스트 `ac9defd`의 목적과 일치한다. 기존 한정 검사 및 현재 후보 검사에서 실제 개인 연락처·계정·활성 비밀정보가 포함됐다는 구체적인 증거는 발견하지 못했다. 이는 모든 행의 비개인정보·모든 과거 값의 무효성을 보증하는 문장이 아니다. test OAuth 설정은 예약된 문서용 제공자 엔드포인트와 Naver 전용 연결 코드에 근거해 예시용 구성으로 분류한다. **새 공개 저장소 계획은 중단하고 기존 PetMilyProject를 유지한다.** 아래 이전 보류 문구는 이 최신 판단으로 대체한다. 최종 113개 후보 + SQL8/bak1 추적 해제만 staging 대상으로 승인됐으며 commit/push/배포는 별도 승인 전 실행하지 않는다.
>
> **이력 관계:** `6271853`(2026-09-15)은 부모 없는 시작 커밋이며 SQL 8개가 그 커밋에 추가됐다. `76da173`·`ac9defd`는 그 커밋이나 현재 master의 조상이 아니다. 2024년 팀원 5명의 이력은 별도 기존 브랜치와 원격 `origin/feature/oracle-migration`에 남아 있으며 현재 staging으로 수정·병합·재작성하지 않는다. 원본 SQL과 미커밋 작업을 보존한다. 추적 해제는 과거 원격 이력을 지우지 않으며, 이후 실제 노출 증거가 확인되면 공개 대응을 다시 판단한다.

> 최종 정리(2026-11-10): 카카오 변수 중복을 최종 적용값 하나로 정리하고, 업종 레이블·기존 키워드 검색 연결·미구현 버튼 비활성화를 완료했다. 기존 111개 후보는 모두 유지하고 SearchBox.jsx/SelectCompoent.jsx 2개를 추가하여 현재 후보는 **113개**, 추적 해제 예정은 여전히 SQL8+bak1이다. 아래 이전 단계의 111개 언급은 당시 기록이다. 원격 참조 갱신 후 대상 SQL/백업 84개 고유 버전(원격 이력 78개)을 검사했고 이메일·휴대전화·BCrypt·JWT 패턴은 검출하지 않았다. SQL 예시/닉네임/본문·병원 주소/연락처의 출처와 실제 개인 식별 가능성은 코드만으로 확정하지 않는다. 원격 test OAuth client-secret 리터럴은 placeholder 형태이나 실제 사용 여부가 미확정이다. GitHub API 확인상 기존 저장소는 public이므로 과거 이력의 공개 범위도 고려해야 한다. **현재 전체 이력을 포함한 공개 승인은 보류한다.** 사용자가 더미로 확인한 DB/JWT와 비활성화한 AWS는 다시 차단 항목으로 조사하지 않았다. staging/commit/push/deploy/이력 재작성 없음.

> 후속 지도 검증(2026-11-10): 사용자는 과거 DB·JWT가 미사용 더미이며 AWS Access Key 2개를 비활성화했다고 확인했다. 새 사용자 소유 JavaScript 키와 localhost:5173 SDK 도메인을 사용해 실제 지도/카테고리 검색/마커·팝업 및 지도 백엔드 API를 검증했다. 키는 문서·추적 파일에 포함하지 않았다. 아래 세 가지 질문은 이전 단계의 기록이며 확인된 DB/JWT/AWS 사항을 다시 요구하지 않는다. **과거 Git 이력·SQL의 개인정보 검토는 별도 미완료이며, 지도 성공으로 전체 공개를 승인하지 않는다.** 기존 111개 후보 목록을 유지하고 변경된 지도 파일의 검토 해시만 갱신했다. staging/commit/push/deploy 없음.

2026-11-10. 기존 보안 보고서와 테스트 기록을 재사용했다. 현재 단계에서는 staging·commit·push·브랜치 생성·배포·Git 이력 재작성을 하지 않았다. 과거 비밀값·토큰·개인정보는 이 문서에 기록하지 않는다.

## 확정한 공개 범위

- 현재 리디자인 JavaScript/JSX/CSS/디자인 토큰 및 `.env.example`.
- 회원·관리자 DTO/접근 검사/MyBatis/JWT/Refresh 구현, 공개 경계 GeoJSON과 관련 컨트롤러.
- 격리 H2/MockMvc·단위·패키징·경계 API·opt-in MariaDB HTTP 테스트와 Gradle 입력.
- 환경 변수만 참조하는 현재 application/default/local/prod 설정. 실제 외부 설정 파일은 제외.
- 루트 README, 본 문서, VERIFICATION, PORTFOLIO, 값 없는 외부 설정 예시만 새 문서 후보로 포함. 이미 추적된 기술문서는 유지한다.

정확한 변경 파일은 이 문서 하단 목록과 로컬 전용 `local-staging/include-files.txt`에 기록한다. 목록 밖의 파일은 자동으로 추가하지 않는다. 기존 UI·보안·테스트 파일은 유지한다.

## 공개 제외와 기존 추적 해제 준비

- `backend/sql/` 8개는 출처 확인을 기다리지 않고 모두 제외한다. DDL 전용으로 분류됐던 profile/refresh도 이번 최소 공개 범위에서는 포함하지 않는다.
- `backend/src/main/resources/application-dev.properties.bak`도 제외한다. 이미 추적 중이므로 ignore만으로는 제거되지 않는다.
- 위 9개는 승인 후 staging 도구에서 `git rm --cached`로 인덱스에서만 제거한다. 현재는 실행하지 않았으며 로컬 원본·내용을 보존한다.
- secret/**, config/private/**, 모든 실제 env, 개인 키/인증서, SQL 백업, JAR/class/build/dist/bin, IDE, 개인 문서와 원시 브라우저/JSON/스크린샷/소스 사본은 공개 대상에서 제외한다.
- `.gitignore`에 SQL·내부 조사 폴더와 최소 문서 허용 목록을 명시했다. 현재 인덱스가 비어 있으므로 실제 추적 해제는 다음 staging에 포함되어야 한다.
- **새 커밋에서 삭제해도 과거 SQL·설정은 Git 이력에 남는다.** 최신 트리 공개 제외는 과거 이력의 개인정보·비밀정보 부재를 증명하지 않는다. 실제 개인정보의 과거 공개가 확인되면 공개 범위 대응을 별도로 결정해야 하며 이력 재작성을 자동 수행하지 않는다.

## 과거 설정의 분류 — 기존 조사 결과

| 항목 ID | 위치/용도 | 확정한 사실 | 아직 모르는 사실 |
| --- | --- | --- | --- |
| DB-local / DB-prod | 추적 application-local/prod의 과거 DB 접속 설정 | 과거 리터럴이 있었고 현재는 DB 환경 변수 참조 | 실제 접속·운영 사용 여부, 현재 유효성, 과거 계정/비밀번호 폐기 여부 |
| JWT-tracked | 위 두 설정의 과거 jwt.secret.key fallback | 현재 고정 fallback 제거. 아래 backup JWT 키와 다른 값 | 테스트/운영 사용 여부, 구 서명 키·토큰의 현재 수용 여부 |
| JWT-backup | 비공개 custom의 별도 JWT_SECRET | 기존 오프라인 조사에서 백업 토큰 3건의 서명과 일치, 조사 당시 모두 만료. tracked JWT와 구분 | 개발/운영 사용 여부, 활성 서비스의 키 교체·Refresh 폐기 여부. 토큰 만료만으로 키 폐기를 보증하지 않음 |
| AWS-local | local의 과거 access/secret 기본값 | 개발 placeholder 패턴, 현재 고정 기본값 제거 | 실제 IAM 키로 사용됐는지, 비활성화·삭제됐는지. 형태만으로 더미 확정하지 않음 |
| Private-key / OAuth | 비공개 secret/config/private | 개인 키 형식·비어 있지 않은 설정이 로컬에 존재. 기존 조사상 해당 secret 경로는 HEAD/저장된 원격 트리에 없음 | 서비스 등록·사용·공유·폐기 여부. 로컬 존재만으로 GitHub 유출을 주장하지 않음 |
| SMTP | 기본/local 과거 설정 | 사용자 확인상 개발 더미 | 실제 Gmail 유출 차단 항목으로 재분류하지 않음 |

전체 약 980개 과거 커밋 재조사나 실제 자격증명 로그인·키 유효성 요청은 하지 않았다. 기존 조사 범위를 전체 이력 안전 보증으로 확대하지 않는다.

## 사용자가 확인할 최대 세 가지

1. **DB/JWT**: 각 항목을 미사용 더미 / 사용 후 폐기·교체 완료 / 현재 사용 / 모름으로 분류한다. 사용했다면 과거 DB 비밀번호 무효화와 구 JWT 키·Refresh 토큰 수용 중단을 확인한다. 값 자체는 전달하지 않는다. 현재 사용이면 먼저 교체·폐기 대응, 모르면 보류한다.
2. **AWS·비공개 인증 설정**: 미사용 더미인지 실제 서비스에 등록됐는지 분류한다. 사용했다면 IAM 등에서 이전 키의 비활성화·삭제를 확인한다. 미사용 근거 또는 폐기 완료만으로 해당 자격증명 상태를 해소하고, 활성/미확인은 보류한다. 서비스 변경을 이 도구가 임의로 수행하지 않는다.
3. **Kakao 콘솔**: 아래 키 종류·등록 도메인·허용 범위를 확인한다. JavaScript 키와 의도한 도메인만 확인되면 콘솔 항목을 해소한다. 잘못된 키 종류·불필요한 도메인은 콘솔에서 수정 후 확인하며, 접근 불가면 보류한다.

## Kakao에서 콘솔만 확인하면 되는 항목

코드 용도는 지도 Web SDK이며 현재 `VITE_KAKAO_MAP_JAVASCRIPT_KEY`로 외부화되어 있다. VITE_ 값은 브라우저에 공개되므로 서버 비밀을 넣으면 안 된다.

1. [Kakao Developers](https://developers.kakao.com/console/app)에서 해당 앱 선택 → **앱 → 플랫폼 키 → JavaScript 키**. 로컬 `.env.local`의 값을 화면에서만 대조한다. 키를 채팅·문서·스크린샷에 복사하지 않는다. Admin/REST 키로 대체하지 않는다.
2. 같은 키의 **JavaScript SDK 도메인** 확인. 실제 사용하는 프로토콜·호스트·포트를 대조한다. localhost와 127.0.0.1 및 http/https는 각각 구분하고, 필요한 개발/운영 origin만 남긴다. 포트폴리오에는 지도 화면의 PNG만 쓰므로 포트폴리오 도메인을 지도 SDK용으로 새 등록할 필요는 없다.
3. 해당 앱의 지도 API 사용 가능 상태·허용 기능·사용 내역/할당량에 이상이 없는지 확인한다. 지도 SDK 코드 외부화·사용 목적 확인은 완료됐으므로 같은 코드 조사를 반복할 필요는 없다.

공식 근거: [지도 Web 가이드](https://apis.map.kakao.com/web/guide/), [앱·플랫폼 키 설정](https://developers.kakao.com/docs/ko/app-setting/app). 실제 등록 내용은 로그인한 앱 소유자만 확인할 수 있다.

## 이번 빌드 확인 및 기존 검증 재사용

- `./gradlew test --tests 'com.backend.admin.*' build --offline` 성공. 7개 task 모두 UP-TO-DATE이며 테스트를 새로 103건 실행했다고 표현하지 않는다. 기존 JUnit XML 111건 = 통과 103·MariaDB opt-in skip 8, 실패/오류 0.
- `npm run build` 새 실행 성공. 기존 500kB 청크 경고 유지. frontend에 test 스크립트 없음.
- 기존 실제 MariaDB HTTP 8개 시나리오와 UI CRUD·로그인·반응형 회귀 기록은 기존 보고서 근거를 재사용하며 새 운영 검증으로 집계하지 않는다.
- 기존 local fallback permitAll/로그인 체인 문제, 일부 비로그인 방명록·라우팅 오류, 외부 OAuth/메일/AI/지도 SDK 전반·운영 HTTPS/DB·동시성 미검증은 남아 있다. 이번에는 기능 코드를 임의 수정하지 않았다.
- 첫 Gradle 시도는 샌드박스 캐시 잠금 접근 제한으로 실패했으며 기존 캐시 접근을 허용한 재실행에서 성공했다. 제품 테스트 실패와 구분한다.

## 선별 staging 준비

로컬 전용 `local-staging/prepare_staging.py --check`로 파일 해시·허용 목록·ignore·인덱스 상태를 다시 검사할 수 있다. 소유자 확인이 pending이면 `--stage`는 거부한다. 민감값 없이 분류가 완료되고 별도 staging 승인을 받으면 현재 허용 목록의 113개 파일과 추적 해제 9개만 처리한다. commit/push 명령은 도구에 없다. `git add -A`, force push, 이력 재작성은 사용하지 않는다.

선별 파일 검사에서 개인 키/JWT/AWS 키 패턴과 과거 추적 설정·비공개 설정·과거 브라우저 키의 현재 후보 내 복제를 확인했고 미해결 검출은 없었다. 기존에 검토한 BCrypt 단위 fixture와 AWS 개발 placeholder의 테스트 사용은 실데이터와 구분하며 후자의 실제 AWS 사용 여부는 사용자 확인 대기다. 정규식·정확 일치 검사는 모든 비밀 형식이나 개인정보를 보증하지 않는다. boot/plain JAR 모두 비공개 리소스 0개·공개 경계 GeoJSON 포함을 재확인했다.

준비 도구의 pending 상태에서 `--stage` 호출이 인덱스 변경 없이 거부되는 것을 확인했다. 인덱스는 비어 있다. 로컬 도구와 manifest에는 경로·해시·상태만 있고 비밀값이 없지만 내부 검토용이므로 ignore 대상이다.

미확인 운영 사실을 임의로 해결했다고 처리하지 않는다. 현 단계는 선별 파일 준비 완료·소유자 확인 대기이며 저장소 전체 공개 승인 완료가 아니다.

## 정확한 추가·수정 파일 목록 — 최종 113개

```text
.gitignore
README.md
backend/build.gradle
backend/src/main/java/com/backend/config/AdminMemberSecurityConfiguration.java
backend/src/main/java/com/backend/controller/member/MemberController.java
backend/src/main/java/com/backend/controller/member/MemberErrorHandler.java
backend/src/main/java/com/backend/controller/member/ReissueController.java
backend/src/main/java/com/backend/controller/place/BoundarySetController.java
backend/src/main/java/com/backend/domain/member/Member.java
backend/src/main/java/com/backend/domain/member/RefreshEntity.java
backend/src/main/java/com/backend/dto/member/AdminMemberPage.java
backend/src/main/java/com/backend/dto/member/AdminMemberSummary.java
backend/src/main/java/com/backend/dto/member/PrivateMemberProfile.java
backend/src/main/java/com/backend/dto/member/PublicMemberProfile.java
backend/src/main/java/com/backend/mapper/member/AdminMemberMapper.java
backend/src/main/java/com/backend/mapper/member/MemberMapper.java
backend/src/main/java/com/backend/mapper/member/RefreshMapper.java
backend/src/main/java/com/backend/security/CustomLogoutFilter.java
backend/src/main/java/com/backend/security/JWTFilter.java
backend/src/main/java/com/backend/security/JWTUtil.java
backend/src/main/java/com/backend/service/member/AdminMemberService.java
backend/src/main/java/com/backend/service/member/MemberAccessService.java
backend/src/main/java/com/backend/service/member/MemberService.java
backend/src/main/resources/application-local.properties
backend/src/main/resources/application-prod.properties
backend/src/main/resources/application.properties
backend/src/main/resources/data/korea-boundaries.geojson
backend/src/test/java/com/backend/admin/AdminApiTestApplication.java
backend/src/test/java/com/backend/admin/AdminLocalProfileTest.java
backend/src/test/java/com/backend/admin/AdminMemberApiTest.java
backend/src/test/java/com/backend/admin/AdminProdProfileTest.java
backend/src/test/java/com/backend/admin/BoundaryResourceTest.java
backend/src/test/java/com/backend/admin/MemberSecurityUnitTest.java
backend/src/test/java/com/backend/admin/PackagedResourceSafetyTest.java
backend/src/test/java/com/backend/admin/live/MariaDbHttpIntegrationTest.java
backend/src/test/java/com/backend/admin/live/MariaDbHttpTestApplication.java
docs/publication/PORTFOLIO.md
docs/publication/RELEASE_READY.md
docs/publication/VERIFICATION.md
docs/publication/config/application.example.properties
frontend/.env.example
frontend/index.html
frontend/src/App.jsx
frontend/src/KakaoMap.jsx
frontend/src/KakaoMap2.jsx
frontend/src/SearchBox.jsx
frontend/src/SearchMap.jsx
frontend/src/SelectCompoent.jsx
frontend/src/api/axiosConfig.js
frontend/src/component/BoardMenu.jsx
frontend/src/component/LoginProvider.jsx
frontend/src/component/Navbar.css
frontend/src/component/Navbar.jsx
frontend/src/component/Pagination.jsx
frontend/src/component/ProfileAvatar.jsx
frontend/src/component/board/BoardCommentComponent.jsx
frontend/src/component/board/BoardCommentEdit.jsx
frontend/src/component/board/BoardCommentItem.jsx
frontend/src/component/board/BoardCommentWrite.jsx
frontend/src/component/chat/AIChat.jsx
frontend/src/component/chat/ChatComponent.jsx
frontend/src/component/chat/FriendsListComponent.jsx
frontend/src/component/place/CommentComponent.jsx
frontend/src/component/place/CommentEdit.jsx
frontend/src/component/place/CommentItem.jsx
frontend/src/component/place/CommentWrite.jsx
frontend/src/design/AccountBoard.css
frontend/src/design/FullAudit.css
frontend/src/design/accountBoardStyles.js
frontend/src/design/fullAuditStyles.js
frontend/src/design/journalTokens.js
frontend/src/page/MainPage.css
frontend/src/page/MainPage.jsx
frontend/src/page/board/BoardEdit.jsx
frontend/src/page/board/BoardList.jsx
frontend/src/page/board/BoardReportList.jsx
frontend/src/page/board/BoardReportListContents.jsx
frontend/src/page/board/BoardView.jsx
frontend/src/page/board/BoardWrite.jsx
frontend/src/page/board/DeleteConfirmationModal.jsx
frontend/src/page/board/ReportModal.jsx
frontend/src/page/diary/diarySrc/diaryComponent/DiaryNavbar.jsx
frontend/src/page/diary/diarySrc/diaryComponent/DiaryVisitorCounter.jsx
frontend/src/page/diary/diarySrc/diaryPage/DiaryHome.jsx
frontend/src/page/diary/diarySrc/diaryPage/DiaryHomeMain.jsx
frontend/src/page/diary/diarySrc/diaryPage/MiniHomeJournal.css
frontend/src/page/diary/diarySrc/diaryPage/diaryBoard/DiaryBoardEdit.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryBoard/DiaryBoardList.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryBoard/DiaryBoardView.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryBoard/DiaryBoardWrite.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryCalendar/DiaryCalendar.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryComment/DiaryComment.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentEdit.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentItem.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentList.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentView.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentWrite.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryComment/DiaryPagination.jsx
frontend/src/page/diary/diarySrc/diaryPage/diaryComment/ReplyWrite.jsx
frontend/src/page/member/MemberEdit.jsx
frontend/src/page/member/MemberFind.jsx
frontend/src/page/member/MemberList.css
frontend/src/page/member/MemberList.jsx
frontend/src/page/member/MemberLogin.jsx
frontend/src/page/member/MemberPage.jsx
frontend/src/page/member/MemberSignup.jsx
frontend/src/page/member/OAuthLogin.jsx
frontend/src/page/place/PlaceMap.jsx
frontend/src/page/place/PlaceMap2.jsx
frontend/src/page/place/PlaceMap3.jsx
frontend/src/page/place/PlaceReview.jsx
frontend/src/theme.js
frontend/vite.config.js
```

## 승인 후 추적 해제할 파일 — 로컬 유지

```text
backend/sql/board.sql
backend/sql/chartsql.sql
backend/sql/chat.sql
backend/sql/diary.sql
backend/sql/hospital.sql
backend/sql/member.sql
backend/sql/profile.sql
backend/sql/refresh.sql
backend/src/main/resources/application-dev.properties.bak
```
