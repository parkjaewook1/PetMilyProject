package com.backend.domain.diary;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DiaryComment {
    private Integer id;
    private Integer diaryId;
    private Integer ownerId;
    private String comment;
    private Integer memberId;
    private Integer replyCommentId;
    private String nickname;
    private LocalDateTime inserted;
    
    private String profileImage;
    // ✅ 대댓글 관련 추가
    private List<DiaryComment> replies; // 자식 대댓글 목록 (미리보기 or 전체)
    private Integer replyCount;         // 대댓글 총 개수
}