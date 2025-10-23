package com.backend.mapper.diary;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface DiaryVisitMapper {

    @Insert("""
                INSERT IGNORE INTO diary_visit (diary_id, member_id, visited_date)
                VALUES (#{diaryId}, #{memberId}, CURDATE())
            """)
    int insertVisit(@Param("diaryId") Integer diaryId,
                    @Param("memberId") Integer memberId);

    @Select("""
                SELECT COUNT(*)
                FROM diary_visit
                WHERE diary_id = #{diaryId}
                  AND visited_date = CURDATE()
            """)
    int countToday(@Param("diaryId") Integer diaryId);

    @Select("""
                SELECT COUNT(*)
                FROM diary_visit
                WHERE diary_id = #{diaryId}
            """)
    int countTotal(@Param("diaryId") Integer diaryId);
}