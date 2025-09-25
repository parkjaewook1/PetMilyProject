package com.backend.mapper.diary;

import com.backend.domain.diary.DiaryComment;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface DiaryCommentMapper {

    // 댓글 등록
    @Insert("""
                INSERT INTO diary_comment (diary_id, member_id, comment)
                VALUES (#{diaryId}, #{memberId}, #{comment})
            """)
    int diaryCommentInsert(DiaryComment diaryComment);

    // 다이어리별 댓글 목록 (페이징)
    @Select("""
                SELECT
                    c.comment_id AS id,
                    m.nickname,
                    c.comment,
                    c.inserted,
                    c.member_id,
                    c.diary_id,
                    d.member_id AS ownerId
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                JOIN diary d ON c.diary_id = d.id
                WHERE c.diary_id = #{diaryId}
                ORDER BY c.comment_id DESC
                LIMIT #{limit} OFFSET #{offset}
            """)
    List<DiaryComment> selectByDiaryId(
            @Param("diaryId") Integer diaryId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // 다이어리별 댓글 개수
    @Select("""
                SELECT COUNT(*)
                FROM diary_comment
                WHERE diary_id = #{diaryId}
            """)
    int countByDiaryId(@Param("diaryId") Integer diaryId);

    // 단일 댓글 조회 (PK: comment_id)
    @Select("""
                SELECT
                    c.comment_id AS id,
                    m.nickname,
                    c.comment,
                    c.inserted,
                    c.member_id,
                    c.diary_id,
                    d.member_id AS ownerId
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                JOIN diary d ON c.diary_id = d.id
                WHERE c.comment_id = #{id}
            """)
    DiaryComment selectById(@Param("id") Integer id);

    // 댓글 삭제
    @Delete("""
                DELETE FROM diary_comment
                WHERE comment_id = #{id}
            """)
    int deleteById(@Param("id") Integer id);

    // 댓글 수정
    @Update("""
                UPDATE diary_comment
                SET comment = #{comment}
                WHERE comment_id = #{id}
            """)
    int diaryUpdate(DiaryComment diaryComment);

    // 다이어리 주인 ID 조회
    @Select("""
                SELECT member_id
                FROM diary
                WHERE id = #{diaryId}
            """)
    Integer findDiaryOwnerIdByDiaryId(@Param("diaryId") Integer diaryId);
}