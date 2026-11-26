# 다이어리와 방명록

## 다이어리

일기 작성·조회·수정·삭제 기능과 캘린더 화면을 연결했습니다. `member.id`(회원), `diary.id`(미니홈피), `diary_board.id`(일기)를 구분해 사용합니다.

| 기능 | 주요 API |
|---|---|
| 일기 작성 | `POST /api/diaryBoard/add` |
| 목록·검색·페이징 | `GET /api/diaryBoard/list` |
| 일기 상세 | `GET /api/diaryBoard/{id}` |
| 일기 수정·삭제 | `PUT /api/diaryBoard/edit`, `DELETE /api/diaryBoard/{id}` |
| 감정 통계 | `GET /api/diary/mood-stats` |

[DiaryBoardService](../backend/src/main/java/com/backend/service/diary/DiaryBoardService.java)에서 같은 날짜에 작성한 일기가 있는지 확인해 하루 한 건만 작성할 수 있도록 구현했습니다. DB에는 날짜별 UNIQUE 제약을 추가하지 않았습니다.

[DiaryCalendar](../frontend/src/page/diary/diarySrc/diaryPage/diaryCalendar/DiaryCalendar.jsx)에서는 일기 목록을 FullCalendar 이벤트로 변환해 표시합니다. 최근 일기 조회는 [DiaryHomeMain](../frontend/src/page/diary/diarySrc/diaryPage/DiaryHomeMain.jsx), 감정 통계와 반응형 화면은 [DiaryHome](../frontend/src/page/diary/diarySrc/diaryPage/DiaryHome.jsx)에 구현했습니다. 캘린더는 목록 API의 페이징 결과를 사용하므로 현재 조회한 페이지의 일기만 표시합니다. 월 단위의 별도 조회 기능은 구현하지 않았습니다.

일기 작성 요청에서 첨부 파일을 받지만 실제 파일 저장과는 연결되어 있지 않습니다. 배너는 별도로 저장하며 배너 URL을 다이어리 DB에 기록하지 않습니다.

## 방명록과 계층형 댓글

댓글과 답글은 같은 테이블에서 관리하고 `replyCommentId`로 부모 댓글을 참조하도록 구현했습니다. [DiaryCommentService](../backend/src/main/java/com/backend/service/diary/DiaryCommentService.java)에서는 답글을 저장하기 전에 부모 댓글이 존재하는지, 같은 미니홈피의 댓글인지 확인합니다.

부모 댓글 목록은 페이징하여 `{ comments, totalPages, currentPage }` 형태로 반환합니다. 전체 댓글은 **평면 배열**로 받아 [DiaryCommentItem](../frontend/src/page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentItem.jsx)에서 부모 ID를 기준으로 자식 댓글을 찾아 재귀적으로 렌더링합니다. 서버에서 중첩된 `children`을 구성하는 방식은 사용하지 않았습니다.

```jsx
// 부모 댓글 ID로 자식 댓글 찾기 (설명용 예시)
const childComments = allComments.filter(
  (c) => String(c.replyCommentId) === String(comment.id)
);
```

자식 댓글마다 같은 컴포넌트를 호출하고, 더 이상 자식이 없으면 재귀 호출을 끝냅니다. 더보기·접기 기능은 이미 조회한 답글의 표시 개수를 조절합니다.

## MyBatis 조회와 감정 통계

[DiaryBoardMapper](../backend/src/main/java/com/backend/mapper/diary/DiaryBoardMapper.java)에서 `diary_board`, `diary`, `member`를 JOIN해 일기와 작성자 정보를 조회합니다. [DiaryCommentMapper](../backend/src/main/java/com/backend/mapper/diary/DiaryCommentMapper.java)에서는 댓글과 회원 정보를 연결합니다.

MyBatis의 `map-underscore-to-camel-case` 설정과 SQL alias를 활용해 컬럼을 Java 객체의 필드에 매핑합니다. 프로젝트를 마친 뒤 댓글 조회에 `AS memberId`, `AS diaryId`를 추가했습니다. 감정 통계는 SQL의 `GROUP BY mood`로 집계합니다.

[테이블 관계 보기](ARCHITECTURE.md#핵심-테이블-관계)
