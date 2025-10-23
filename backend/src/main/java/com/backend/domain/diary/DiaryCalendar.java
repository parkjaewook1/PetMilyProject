package com.backend.domain.diary;


import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DiaryCalendar {
    private Integer diaryId;
    private String title;
    private LocalDateTime inserted;
}
