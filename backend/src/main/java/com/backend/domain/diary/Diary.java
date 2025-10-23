package com.backend.domain.diary;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Diary {
    private Integer id;          // PK
    private String title;
    private String content;
    private Integer memberId;    // 작성자 FK
    private String mood;         // HAPPY, SAD, ...
    private LocalDateTime inserted;
    private LocalDateTime updated;
    private Integer viewCount;

    private String introduction;

    // ✅ 공개 범위: PUBLIC, FRIENDS, PRIVATE
    private String visibility = "PUBLIC";
}