# 다이어리와 방명록

## 다이어리

다이어리에서는 일기를 작성하고 날짜별로 확인할 수 있도록 CRUD와 캘린더 화면을 연결했다. `member.id`는 회원 ID, `diary.id`는 미니홈피 ID, `diary_board.id`는 개별 일기 ID로 구분해 사용한다.

| 기능 | 주요 API |
|---|---|
| 일기 작성 | `POST /api/diaryBoard/add` |
| 목록·검색·페이징 | `GET /api/diaryBoard/list` |
| 일기 상세 | `GET /api/diaryBoard/{id}` |
| 일기 수정·삭제 | `PUT /api/diaryBoard/edit`, `DELETE /api/diaryBoard/{id}` |
| 감정 통계 | `GET /api/diary/mood-stats` |

[DiaryBoardService](../backend/src/main/java/com/backend/service/diary/DiaryBoardService.java)는 같은 날짜에 이미 작성한 일기가 있는지 확인해 하루 한 건만 작성하도록 검사한다. 날짜별 UNIQUE 제약은 추가하지 않았다.

[DiaryCalendar](../frontend/src/page/diary/diarySrc/diaryPage/diaryCalendar/DiaryCalendar.jsx)는 일기 목록을 FullCalendar 이벤트로 변환해 보여 준다. 최근 일기는 [DiaryHomeMain](../frontend/src/page/diary/diarySrc/diaryPage/DiaryHomeMain.jsx)에서 조회하고, 감정 통계와 반응형 화면은 [DiaryHome](../frontend/src/page/diary/diarySrc/diaryPage/DiaryHome.jsx)에 구현했다. 캘린더는 목록 API가 반환한 페이징 결과를 사용한다. 월 전체 일기를 별도로 조회하는 구조는 아니므로, 조회한 페이지에 포함된 일기만 이벤트로 표시된다.

일기 첨부 파일은 요청에서 수신하지만 작성 Service의 파일 저장에는 연결되어 있지 않다. 배너 저장은 별도로 처리하며, 배너 URL을 다이어리 DB에 기록하지 않는다.

## 방명록과 계층형 댓글

방명록의 댓글과 답글은 같은 테이블에서 관리한다. 답글은 `replyCommentId`로 부모 댓글을 참조하고, 이 관계를 이용해 계층을 구성한다. [DiaryCommentService](../backend/src/main/java/com/backend/service/diary/DiaryCommentService.java)는 답글 저장 시 부모 댓글의 존재 여부와 같은 다이어리에 속하는지 확인한다.

부모 댓글 목록은 페이징하여 `{ comments, totalPages, currentPage }` 형태로 반환한다. 전체 댓글 조회는 **평면 배열**을 반환하며, 중첩된 `children` 객체를 서버에서 구성해 보내지는 않는다. [DiaryCommentItem](../frontend/src/page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentItem.jsx)은 배열에서 현재 댓글의 자식을 찾아 같은 컴포넌트를 재귀적으로 렌더링한다.

```jsx
// 부모 댓글 ID로 자식 댓글 찾기 (설명용 예시)
const childComments = allComments.filter(
  (c) => String(c.replyCommentId) === String(comment.id)
);
```

찾은 자식마다 같은 컴포넌트를 호출하고, 자식이 없으면 재귀 렌더링을 종료한다. 더보기·접기 기능은 이미 받아온 답글의 표시 개수를 조절한다.

## MyBatis 조회와 감정 통계

[DiaryBoardMapper](../backend/src/main/java/com/backend/mapper/diary/DiaryBoardMapper.java)는 `diary_board`, `diary`, `member`를 JOIN해 일기와 작성자 정보를 조회한다. [DiaryCommentMapper](../backend/src/main/java/com/backend/mapper/diary/DiaryCommentMapper.java)는 댓글과 회원 정보를 연결한다.

MyBatis에서는 `map-underscore-to-camel-case` 설정과 SQL alias를 사용해 컬럼을 Java 객체의 필드에 매핑한다. 댓글 조회의 `AS memberId`, `AS diaryId`는 프로젝트 종료 후 직접 추가한 변경이다. 감정 통계는 SQL의 `GROUP BY mood`로 집계한다.

[테이블 관계 보기](ARCHITECTURE.md#핵심-테이블-관계)
