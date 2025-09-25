package com.backend.domain.diary;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DiaryBoard {
    private Integer id;              // diary.board.id(게시글 pk)
    private Integer diaryId;
    private String title;
    private String content;
    private String nickname;
    private String writer;
    private Integer memberId;        // member.id
    private LocalDateTime inserted;

    private Integer numberOfImages;
    private List<String> imageSrcList;

    private List<DiaryBoardFile> fileList; // 내부도 Integer 타입 확인

    private String mood; // HAPPY, NEUTRAL, SAD, ANGRY, TIRED
}