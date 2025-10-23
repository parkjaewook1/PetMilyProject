package com.backend.domain.diary;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DiaryVisit {
    private Integer id;
    private Integer diaryId;
    private Integer memberId;
    private LocalDate visitedDate;
    private LocalDateTime createdAt;
}