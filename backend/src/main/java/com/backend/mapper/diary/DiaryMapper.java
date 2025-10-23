package com.backend.mapper.diary;

import com.backend.domain.diary.Diary;
import com.backend.domain.diary.MoodStat;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface DiaryMapper {

    // 월별 mood 통계 → diary_board 기준으로 변경
    @Select("""
                SELECT mood, COUNT(*) AS count
                FROM diary_board
                WHERE diary_id = (
                    SELECT id FROM diary WHERE member_id = #{memberId}
                )
                AND DATE_FORMAT(inserted, '%Y-%m') = #{yearMonth}
                GROUP BY mood
            """)
    List<MoodStat> getMonthlyMoodStats(@Param("memberId") Integer memberId,
                                       @Param("yearMonth") String yearMonth);

    // 다이어리 생성 (기본정보만)
    @Insert
            ("""
                    INSERT INTO diary (member_id, title, introduction, visibility, inserted, updated)
                    VALUES (#{memberId}, #{title}, #{introduction}, #{visibility}, NOW(), NOW())
                    """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insertDiary(Diary diary);

    // 다이어리 기본정보 조회
    @Select("SELECT * FROM diary WHERE member_id = #{memberId}")
    Diary selectByMemberId(Integer memberId);

    @Select("SELECT * FROM diary WHERE id = #{id}")
    Diary selectById(Integer id);
}

// 필요 시 홈 화면 전용 쿼리(최근 글, 프로필 등) 추가 가능

