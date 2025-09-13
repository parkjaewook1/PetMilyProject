package com.backend.domain.diary;


import lombok.Data;

@Data
public class MoodStat {

    private String mood; //(happy, sad 등등)
    private int count;  //(해당 기분 등록 개수)
}
