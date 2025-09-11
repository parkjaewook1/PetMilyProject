package com.backend.mapper.diary;

import com.backend.domain.diary.DiaryComment;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface DiaryCommentMapper {

    @Insert("""
                        INSERT INTO diary_comment
                (diary_id, member_id, comment)
                VALUES (#{diaryId}, #{memberId}, #{comment})
            """)
    int diaryCommentInsert(DiaryComment diaryComment);

    @Select("""
                    SELECT
                    c.comment_id AS id,
                    m.nickname,
                    c.comment,
                    c.inserted,
                    c.member_id
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                WHERE c.diary_id = #{diaryId}
                ORDER BY c.comment_id DESC
            """)
    List<DiaryComment> selectByDiaryId();

    @Delete("""
                   DELETE FROM diary_comment
                WHERE comment_id = #{id}
            """)
    int deleteById(Integer id);

    @Select("""
                        SSELECT
                    c.comment_id AS id,
                    m.nickname,
                    c.comment,
                    c.inserted,
                    c.member_id
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                WHERE c.comment_id = #{id}
            """)
    DiaryComment selectById(Integer id);

    @Update("""
                UPDATE diary_comment
                SET comment = #{comment}
                WHERE comment_id = #{id}
            """)
    int diaryUpdate(DiaryComment diaryComment);

    @Select("""
            SELECT *
            FROM diary_comment
            WHERE id = #{id}
            """)
    int selectgetById(Integer id);

    // 페이징
    
    @Select("""
                    SELECT
                    c.comment_id AS id,
                    m.nickname,
                    c.comment,
                    c.inserted,
                    c.member_id
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                ORDER BY c.inserted DESC
                LIMIT #{limit} OFFSET #{offset}
            """)
    List<DiaryComment> selectAll(@Param("limit") int limit, @Param("offset") int offset);

    @Select("""
                    SELECT COUNT(*)
                FROM diary_comment
            """)
    int countAllComments();
}
