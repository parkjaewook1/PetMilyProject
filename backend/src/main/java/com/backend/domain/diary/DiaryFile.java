package com.backend.domain.diary;

import lombok.Data;

@Data
public class DiaryFile {
    private Integer id;       // PK
    private Integer diaryId;  // FK
    private String name;
}