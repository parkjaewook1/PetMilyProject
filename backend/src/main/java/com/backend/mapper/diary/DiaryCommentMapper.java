package com.backend.mapper.diary;

import com.backend.domain.diary.DiaryComment;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface DiaryCommentMapper {

    // 댓글 등록
    @Insert("""
                INSERT INTO diary_comment (diary_id, member_id, comment, reply_comment_id)
                VALUES (#{diaryId}, #{memberId}, #{comment}, #{replyCommentId})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    // ✅ 자동 생성된 PK를 DiaryComment.id에 세팅
    int diaryCommentInsert(DiaryComment diaryComment);

    // ✅ 부모 댓글 목록 (페이징 전용)
    @Select("""
                SELECT
                    c.comment_id AS id,
                    m.nickname,
                    c.comment,
                    c.inserted,
                    c.reply_comment_id AS replyCommentId,
                    c.member_id,
                    c.diary_id,
                    d.member_id AS ownerId
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                JOIN diary d ON c.diary_id = d.id
                WHERE c.diary_id = #{diaryId}
                  AND c.reply_comment_id IS NULL
                ORDER BY c.comment_id DESC
                LIMIT #{limit} OFFSET #{offset}
            """)
    List<DiaryComment> selectParentComments(
            @Param("diaryId") Integer diaryId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // ✅ 부모 댓글 개수 (페이징 totalPages 계산용)
    @Select("""
                SELECT COUNT(*)
                FROM diary_comment
                WHERE diary_id = #{diaryId}
                  AND reply_comment_id IS NULL   -- ✅ 부모 댓글만
            """)
    int countParentCommentsByDiaryId(@Param("diaryId") Integer diaryId);

    // 단일 댓글 조회
    @Select("""
                SELECT
                    c.comment_id AS id,
                    m.nickname,
                    c.comment,
                    c.inserted,
                    c.member_id,
                    c.diary_id,
                    d.member_id AS ownerId,
                    c.reply_comment_id AS replyCommentId
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                JOIN diary d ON c.diary_id = d.id
                WHERE c.comment_id = #{commentId}
            """)
    DiaryComment selectById(@Param("commentId") Integer commentId);

    // 댓글 삭제
    @Delete("""
                DELETE FROM diary_comment
                WHERE comment_id = #{commentId}
            """)
    int deleteById(@Param("commentId") Integer commentId);

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

    // 최근 방명록 (대댓글 제외)
    @Select("""
                SELECT
                    c.comment_id AS id,
                    c.diary_id,
                    c.member_id,
                    c.comment,
                    c.inserted,
                    m.nickname
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                WHERE c.diary_id = #{diaryId}
                  AND c.reply_comment_id IS NULL   -- ✅ 부모 댓글만
                ORDER BY c.inserted DESC
                LIMIT #{limit}
            """)
    List<DiaryComment> selectRecentComments(@Param("diaryId") Integer diaryId,
                                            @Param("limit") int limit);

    // 특정 부모 댓글의 전체 대댓글
    @Select("""
                SELECT
                    c.comment_id AS id,
                    m.nickname,
                    c.comment,
                    c.inserted,
                    c.reply_comment_id AS replyCommentId,
                    c.member_id,
                    c.diary_id
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                WHERE c.reply_comment_id = #{commentId}
                ORDER BY c.comment_id ASC
            """)
    List<DiaryComment> selectAllReplies(@Param("commentId") Integer commentId);

    // 특정 부모 댓글의 대댓글 개수
    @Select("""
                SELECT COUNT(*)
                FROM diary_comment
                WHERE reply_comment_id = #{commentId}
            """)
    int countReplies(@Param("commentId") Integer commentId);

    @Select("""
                SELECT
                    c.comment_id AS id,
                    c.diary_id,
                    c.member_id,
                    c.comment,
                    c.inserted,
                    c.reply_comment_id AS replyCommentId,
                    m.nickname
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                WHERE c.diary_id = #{diaryId}
                ORDER BY c.comment_id ASC
            """)
    List<DiaryComment> selectAllByDiaryId(@Param("diaryId") Integer diaryId);

    // ✅ 부모 댓글 개수 (검색 조건 포함)
    @Select("""
                <script>
                SELECT COUNT(*)
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                WHERE c.diary_id = #{diaryId}
                  AND c.reply_comment_id IS NULL
                <if test="type == 'writer'">
                  AND m.nickname LIKE CONCAT('%', #{keyword}, '%')
                </if>
                <if test="type == 'content'">
                  AND c.comment LIKE CONCAT('%', #{keyword}, '%')
                </if>
                <if test="type == 'all'">
                  AND (m.nickname LIKE CONCAT('%', #{keyword}, '%')
                       OR c.comment LIKE CONCAT('%', #{keyword}, '%'))
                </if>
                </script>
            """)
    int countParentCommentsByDiaryIdAndSearch(
            @Param("diaryId") Integer diaryId,
            @Param("type") String type,
            @Param("keyword") String keyword
    );

    // ✅ 부모 댓글 목록 (검색 조건 포함)
    @Select("""
                <script>
                SELECT
                    c.comment_id AS id,
                    m.nickname,
                    c.comment,
                    c.inserted,
                    c.reply_comment_id AS replyCommentId,
                    c.member_id,
                    c.diary_id,
                    d.member_id AS ownerId
                FROM diary_comment c
                JOIN member m ON c.member_id = m.id
                JOIN diary d ON c.diary_id = d.id
                WHERE c.diary_id = #{diaryId}
                  AND c.reply_comment_id IS NULL
                <if test="type == 'writer'">
                  AND m.nickname LIKE CONCAT('%', #{keyword}, '%')
                </if>
                <if test="type == 'content'">
                  AND c.comment LIKE CONCAT('%', #{keyword}, '%')
                </if>
                <if test="type == 'all'">
                  AND (m.nickname LIKE CONCAT('%', #{keyword}, '%')
                       OR c.comment LIKE CONCAT('%', #{keyword}, '%'))
                </if>
                ORDER BY c.comment_id DESC
                LIMIT #{limit} OFFSET #{offset}
                </script>
            """)
    List<DiaryComment> selectParentCommentsBySearch(
            @Param("diaryId") Integer diaryId,
            @Param("type") String type,
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") int offset
    );
}